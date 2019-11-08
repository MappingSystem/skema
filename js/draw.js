// Set editor
var editor = ace.edit("editor");
editor.setOptions({fontSize: "10pt"});
editor.setTheme("ace/theme/crimson_editor");
editor.getSession().setMode("ace/mode/asciidoc");
editor.getSession().on('change', _.debounce(function() {draw.diagram();}, 100));

// Put all of the process variables in to global
var id, js, ids, pad, back, feed, json, init, link, size, test, type, style, skema, select, params, draw = {

    diagram : function() {

        editor.clearSelection(); 
        editor.gotoLine(1, 1);

       _.each(json, function(item, index) {

            if (item['title'] == type) {

                if (type != 'Scenetree') {

                    $('#diagram').show();
                    $('#diagram, #graphiql, #viewport').empty();
                    $('#diagram').attr('class', 'diagram-' + type.toLowerCase());

                } else {

                    $('#diagram').hide();
                    $('#diagram, #graphiql').empty(); $('#viewport').html('<canvas></canvas>'); 
                    $('body').on('DOMSubtreeModified', '.resultWrap', function() {draw.query();});

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
                if (this.id == 'json') {this.href = feed;} else {$(this).css({'cursor':'no-drop'});}
                if (item[this.id]) {this.href = item[this.id]; $(this).css({'cursor':'pointer'});}
            }

        });

        $('#type').text(type); 
        $('#type')[0].href = '/' + type.toLowerCase();

        if (test) test = false;
        draw.getScript(item);

    },


    getScript : function(item) {

        $(".loadingImg").show();
        js = '/' + item['js'] + '?t=' + $.now();
        $.getScript(js, function( data, textStatus, jqxhr ) {

            var diagram;
            var g = $('#diagram').get(0);

            if (type == 'Sequence') {
                var font_size = (select == 'hand')? 13: 15;
                style = {theme: select, "font-size": font_size};
 
                if (!skema) {skema = editor.getValue();}
            }


            try {

                //Support Skema with all diagram types including ones from GraphiQL/Threejs/D3 
                if (type == 'Sitewheel') {initialize(skema).then (function (control) {doTheTreeViz(control);});}
                else if (type == 'Flowchart') {diagram = flowchart.parse(skema); diagram.drawSVG(g, style);}
                else if (type == 'Sequence') {diagram = Diagram.parse(skema); diagram.drawSVG(g, style);}
                else if (type == 'Railroad') {main.drawDiagramsFromSerializedGrammar(skema, g);}
                else if (type == 'Nodelinks') {diagram = draw.makeSvg(); g.prepend(diagram);}
                else if (type == 'Scenetree') {diagram = d3.select('#viewport');}

            } finally {

                //set element
                draw.element();
                $('.loadingImg').hide();

                //set idle time of inactivity
                var hash = '#chetabahana-skema';
                $('body').on('click mousemove keyup', _.debounce(function(){draw.reload(hash);}, 600000));

            }

        });

    },

    element : function() {

        if (!$('#diagram, #graphiql').find('svg')[0]) {

            window.requestAnimationFrame(draw.element);

        } else if ($(".theme").val() != 'hand') {

            var elements;

            //get mandatory elements 
            if (type == 'Sequence') {elements = $('svg g.title, svg g.actor, svg g.signal');}
            else if (type == 'Flowchart') {elements = $('svg rect.flowchart, svg path.flowchart');}
            else if (type == 'Scenetree') {draw.clone(); elements = $('button svg path').attr('class','eQuery');}
            else if (type == 'Nodelinks') {elements = $('svg g g g').hover(function() {$(this).hide(100).show(100);});}
            else if (type == 'Railroad') {elements = $('svg path').first().add($('svg rect')).add($('svg path').last());}

            //set each id and its handle 
            if (type != 'Sitewheel') {elements.each(function(index) {draw.node(index, this);});}
            if (type != 'Sitewheel' && type != 'Scenetree') {elements.click(function() {draw.click(this);});}

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
        draw.feed();

    },

    makeSvg : function() {

        var $ = go.GraphObject.make;
        var myDiagram = $(go.Diagram, "viewport");
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

            } else {
 
                style = result.items[0].style; skema = result.items[0].skema;
                editor.setValue(draw.encode(JSON.stringify(skema, draw.replacer, '\t')));

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
        if ($(".theme").val() != 'hand') {draw.diagram();}
        else {id = ids = feed = json = size = type = skema = null; draw.getJSON();}

    },

    query : function() {

        if (!test) {
            if($('#diagram').is(':visible')){$('#diagram').hide(); $(".loadingImg").show();}
            var result = "{" + $('#graphiql .resultWrap').text().split("{").pop();
            if (draw.isJSON(result)) {test = !test; draw.click($('.eQuery').last());}
        }

    },

    node : function(i, e) {

        if (i != 0) {e.id = draw.pad(i);}
        else {e.id = (ids.length > 1)? ids[ids.length - 2]: ("0").repeat((pad + 3 < size)? pad + 3: pad + 3 - size) + 1;}

        e.parentNode.appendChild(e);
        $(e).filter('.eQuery').css({'pointer-events':'auto'});
        $(e).filter('.title, .actor, .signal').hover(function() {$(this).hide(100).show(100);});

        $(e).mouseenter(function(){$(this).css('fill','teal')}).mouseout(function(){$(this).css('fill','')});
        $(e).css({'cursor':'pointer'}).attr('class', function(index, classNames) {return classNames + ' mypointer';});

    },


    clone : function() {

        var button = $('button.execute-button').clone();
        button.prependTo($('button.execute-button').parent());

        button.attr('title','Back to previous session');
        button.click(function() {draw.click($('.eQuery').first());});  

        var svg = button.find('svg path');
        svg.css({'transform':'rotate(180deg)','transform-origin':'48% 47%'});

        var queryWrap = $('#graphiql .queryWrap .CodeMirror')[0].CodeMirror;
        queryWrap.setValue(skema);

    },

    pad : function(i) {

        //Utilize pad in to the workflows id
        var s = String(i);
        while (s.length < (pad || size)) {s = "0" + s;}
        return s;

    },

    feed : function() {
var obj = new window["part"]();
        if (typeof obj !== "undefined") {feed = obj.feed(id, size); draw.getJSON();}
        else {$.getScript('skema/js/part.js', function() {draw.feed();});}

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
