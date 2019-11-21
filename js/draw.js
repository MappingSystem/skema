// Set editor
var editor = ace.edit("editor");
editor.setOptions({fontSize: "10pt"});
editor.setTheme("ace/theme/crimson_editor");
editor.getSession().setMode("ace/mode/asciidoc");
editor.getSession().on('change', _.debounce(function() {draw.diagram();}, 100));

// Put all of the process variables in to global
var id, js, ids, pad, back, data, feed, json, link, size, test, type, query, select, params, draw = {

    diagram : function() {

        editor.clearSelection(); 
        editor.gotoLine(1, 1);

       _.each(json, function(item, index) {

            if (item['title'] == type) {

                $('#diagram').empty();

                if (type != 'Node') {

                    $('#diagram').show();
                    $('#graphiql, #viewport').css("visibility", "hidden");
                    $('#diagram').attr('class', 'diagram-' + type.toLowerCase());

                } else {

                    $('#diagram').hide();
                    $('#graphiql, #viewport').css("visibility", "visible");
                    if (!$('#viewport canvas').length) $('#viewport').html('<canvas></canvas>'); 
                    $('#viewport canvas').width(400).height(317).css({"position": "absolute", "right": "-4px"});

                    //set handle and idle time
                    var dom = 'DOMSubtreeModified';
                    var hash = '#chetabahana-skema';
                    var event = 'click mousemove keyup';

                    $('body').on(dom, '.resultWrap', function() {draw.query();});
                    $('body').on(event, _.debounce(function(){draw.reload(hash);}, 600000));

                }

                pad = index;
                draw.getLinks(item);

            }

        });

    },

    getLinks : function(item) {

        select = $(".theme").val();

        //Extend workflows links on each skema
        $('#tautan a').each(function(key, value) {

            if (select == 'hand') {
                $(this).css({'cursor':'pointer'});
                this.href = link.slice(key,key+1).get(0).href;
            } else {
                if (this.id == 'json') {this.href = feed;}
                else if (data) {this.href = data.guide[this.id];}
            }

        });

        $('#type').text(type); 
        $('#type')[0].href = '/' + type.toLowerCase();
        $('#doc')[0].href = 'https://github.com/chetabahana/chetabahana.github.io/wiki/' + type;

        if (test) test = false;
        $(".loadingImg").show();

        if (type == 'Node' && $('#graphiql').find('svg')[0]) {draw.element();}
        else {draw.getScript();}

    },

    getScript : function(item) {

        if (select != 'hand') {

            var style = data.style;
            var skema = data.skema;
            var js = '/' + data.guide['js'];

        } else if (type == 'Sequence') {

            var style = {theme: 'hand', "font-size": 13};
            var skema = (data)? data.skema: editor.getValue();
            var js = '/sequence/js/sequence-diagram-snap-min.js';

        }

        $.getScript(js + '?t=' + $.now(), function() {

            try {

                var diagram;
                var g = $('#diagram').get(0);

                //Support Skema with all diagram types including ones from GraphiQL/Threejs/D3 
                if (type == 'Railroad') {main.drawDiagramsFromSerializedGrammar(skema, g);}
                else if (type == 'Sequence') {diagram = Diagram.parse(skema); diagram.drawSVG(g, style);}
                else if (type == 'Nodelinks') {diagram = draw.makeSvg(style, skema); g.prepend(diagram);}
                else if (type == 'Flowchart') {diagram = flowchart.parse(skema); diagram.drawSVG(g, style);}
                else if (type == 'Sitewheel') {initTheTreeViz(skema).then (function (control) {doTheTreeViz(control);});}

            } finally {

                //set element
                draw.element();
                $('.loadingImg').hide();

            }

        });

    },

    element : function() {
 
        var cm = $('#graphiql .queryWrap .CodeMirror')[0];

        var x = ($('#diagram').is(':visible') && !$('#diagram').find('svg')[0])? true: false;
        var y = ($('#graphiql').css('visibility') === 'visible' && !cm)? true: false;
        var z = (cm && !(cm.CodeMirror instanceof Object))? true: false;

        if (x || y || z) {

            window.requestAnimationFrame(draw.element);

        } else if ($(".theme").val() != 'hand') {

            var elements;

            //get mandatory elements 
            if (type == 'Node') {elements = draw.clone($('button.execute-button'), 'svg path');}
            else if (type == 'Sequence') {elements = $('svg g.title, svg g.actor, svg g.signal');}
            else if (type == 'Flowchart') {elements = $('svg rect.flowchart, svg path.flowchart');}
            else if (type == 'Nodelinks') {elements = $('svg g g g').hover(function() {$(this).hide(100).show(100);});}
            else if (type == 'Railroad') {elements = $('svg path').first().add($('svg rect')).add($('svg path').last());}

            //set each id and its handle 
            if (type != 'Sitewheel' && type != 'Node') {elements.click(function() {draw.click(this);});}
            if (elements) {elements.each(function(index) {draw.node(index, this);});}
            if (type == 'Node') {query = cm.CodeMirror; draw.feed('tree');}
        }

    },

    click : function(e) {

        //disable click events to avoid interruption
        $('.mypointer').css('pointer-events', 'none');
        if ($('#diagram').is(':visible')) {$('#diagram').hide(); $(".loadingImg").show();}

        //Allow diagram to get the occurred index of a given object's 
        id = $(e).attr("id"); var ln = id.length; var ls = ids.length;
        (ln == pad || ln - size == pad)? ids.push(id): ids.pop();

        //id.length vs type index (1»2 2»3 3»4 4»0 5»1)
        pad = (ln + 1 >= size)? ln - size + 1: ln + 1;
        type = json[pad]['title'];
        draw.feed('part');

    },

    makeSvg : function(style, skema) {

        var $ = go.GraphObject.make;
        var myDiagram = $(go.Diagram, "diagram");
        myDiagram.model = new go.GraphLinksModel(style, skema);

        myDiagram.nodeTemplate = $(go.Node, "Auto",
            $(go.Shape, "RoundedRectangle", new go.Binding("fill", "color")),
            $(go.TextBlock, { margin: 3 }, new go.Binding("text", "key"))
        );

        var svg = myDiagram.makeSvg({scale: 2});
        myDiagram.div = null;
        return svg;

    }, 

    xmlData : function() {

        var a = $(this);
        var svg = $("#diagram").find('svg')[0];
        var width = parseInt(svg.width.baseVal.value);
        var height = parseInt(svg.height.baseVal.value);
        var xmldata = '<?xml version="1.0" encoding="utf-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd"><svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" xmlns:xlink="http://www.w3.org/1999/xlink"><source><![CDATA[' + skema + ']]></source>' + svg.innerHTML + '</svg>';
        a.attr("download", "diagram.svg"); 
        var xml = encodeURIComponent(xmldata);
        a.attr("href", "data:image/svg+xml," + xml);

    },

    getJSON : function() {

        //Inject Workflows from getJSON
        if (!type) type = 'Sequence';
        if (ids == null) ids = new Array();
        if (!link) link = $('#tautan a').clone();
        if (!feed) feed = '/feed.json?t=' + $.now();

        $.getJSON(feed).done(function(result){

            if (!json) json = result.items[4].items;
            if (!size) size = json.length;

            if (pad == null) {

                draw.diagram();

            } else if (id == null) {

                $("<div>", {id: "1"}).appendTo($("#diagram"));
                draw.click($("#1"));

            } else if (data == null) {
 
                data = result.items[0];
                editor.setValue(draw.encode(JSON.stringify(data.skema, draw.replacer, '\t')));

            } else if (window['tree']) {

                //Support Asynchronous Json Data Driven on Workflows(#39)
                data = result.items[0];
                query.setValue(draw.encode(data.skema));

            }

        });

    },

    replacer : function(key, value) {

        //Remove double quotes from a String 
        //https://stackoverflow.com/q/19156148/4058484 && https://stackoverflow.com/a/21605936/4058484
        if (typeof value === 'string' || value instanceof String) {return value.replace("\"(.+)\"", "$1");}
        else {return value;}

    },

    isJSON : function(str) {

        if (str == "{" ) return false;
        if ( /^\s*$/.test(str)) return false;
        str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
        str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
        str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        return (/^[\],:{}\s]*$/).test(str);

    },

    change : function() {

        var regex = /[?&]([^=#]+)=([^&#]*)/g, url = window.location.href, params = {}, match;
        while(match = regex.exec(url)) {params[match[1]] = match[2];}

        //Strict Workflows default to Sequence but not the index 
        id = ids = data = feed = json = size = type = null;
        draw.getJSON();

    },

    query : function() {

        if (!test) {
            var result = "{" + $('#graphiql .resultWrap').text().split("{").pop();
            if (draw.isJSON(result)) {test = !test; draw.click($('.eQuery').last());}
        }

    },

    name : function(value) {

        if (typeof value !== 'string') {return 'mypointer';}
        else {return value.replace(' mypointer', '') + ' mypointer';}

    },

    node : function(i, e) {

        if (i != 0) {e.id = draw.pad(i);}
        else {e.id = (ids.length > 1)? ids[ids.length - 2]: ("0").repeat((pad + 3 < size)? pad + 3: pad + 3 - size) + 1;}

        e.parentNode.appendChild(e);
        $(e).filter('.eQuery').css({'pointer-events':'auto'});
        $(e).filter('.title, .actor, .signal').hover(function() {$(this).hide(100).show(100);});

        $(e).mouseenter(function(){$(this).css('fill','teal')}).mouseout(function(){$(this).css('fill','')});
        $(e).css({'cursor':'pointer'}).attr('class', function(index, classNames) {return draw.name(classNames);});

    },

    loading : function() {

        if ($('#diagram').is(':visible') || $('#graphiql').css('visibility') === 'visible') {
            $('#diagram').hide(); $('#graphiql, #viewport').css("visibility", "hidden");
            $(".loadingImg").show();
        }

    },

    feed : function(scope) {

        //Support Unlimited Scripts on Workflows Algorithm (#36)
        if (window[scope]) {window[scope].feed(id, size);}
        else {$.getScript('skema/js/' + scope + '.js', function() {draw.feed(scope);});}

    },

    clone : function(e, path) {

        var title = 'Back to previous session';
        if (e.first().attr('title') == title) return $(path);

        var button = e.clone(); button.prependTo(e.parent()); button.attr('title',title);
        button.click(function() {draw.click($('.eQuery').first());});  
 
        e.mouseup(_.debounce(function(){draw.loading();}, 300));
        return $(path).attr('class','eQuery');

    },

    pad : function(i) {

        //Utilize pad in to the workflows id
        var s = String(i);
        while (s.length < (pad || size)) {s = "0" + s;}
        return s;

    },

    reload : function(hash) {

        scrollTo(hash); window.stop();
        location.hash = hash; location.reload(true);

    },

    encode : function(val) {

        return val.replace(/^"(.*)"$/, "$1")
                  .replace(/\\n/g, "\n")
                  .replace(/&apos;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/&gt;/g, '>')
                  .replace(/&lt;/g, '<')
                  .replace(/&amp;/g, '&')
                  .replace(/<p>/g, '')
                  .replace(/<\/p>/g, '')
                  .replace(/‘/g, "'")
                  .replace(/’/g, "'")
        ;

    }, 

    svg : {}

}
