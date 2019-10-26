$(window).load(function() {draw.getJSON();});
$('.theme').change(function() {draw.change();});
$('.download').click(function(ev) {draw.xmlData();});

var editor = ace.edit("editor");
editor.setOptions({fontSize: "10pt"});
editor.setTheme("ace/theme/crimson_editor");
editor.getSession().setMode("ace/mode/asciidoc");
editor.getSession().on('change', _.debounce(function() {draw.diagram();}, 100));

// Put all of the process variables in to global type 
var js, pad, json, init, link, size, test, type, style, skema, select, params, draw = {

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
                if (item[this.id]) {this.href = item[this.id];}
                else if (this.id != 'json') {$(this).css({'cursor':'no-drop'});}
            }

        });

        $('#type').text(type); 
        $('#type')[0].href = '/' + type.toLowerCase();
        draw.getScript(item);

    },


    getScript : function(item) {

        $(".loadingImg").show();
        js = '/' + item['js'] + '?t=' + $.now();
        $.getScript(js, function( data, textStatus, jqxhr ) {

            var diagram;
            var g = $('#diagram').get(0);
            var font_size = (select == 'hand')? 13: 15;

            if (test) test = false;
            if (!skema) {init = editor.getValue(); skema = init;}
            if (type == 'Sequence') style = {theme: select, "font-size": font_size};

            try {

                //Support Skema with all diagram types including ones from GraphiQL/Threejs/D3 
                if(type == 'Sequence') {diagram = Diagram.parse(skema); diagram.drawSVG(g, style);}
                else if(type == 'Flowchart') {diagram = flowchart.parse(skema); diagram.drawSVG(g, style);}
                else if(type == 'Railroad') {diagram = eval(skema).format(style); diagram.addTo(g);}
                else if(type == 'Nodelinks') {diagram = draw.makeSvg(); g.prepend(diagram);}
                else if(type == 'Scenetree') {diagram = d3.select('#viewport');}

            } finally {

                draw.element();
                $('.loadingImg').hide();

            }

        });

    },

    element : function() {

        if (!$('#diagram, #graphiql').find('svg')[0]) {

            window.requestAnimationFrame(draw.element);

        } else if($(".theme").val() != 'hand') {

            var elements;
            var hash = '#chetabahana-skema';

            //get svg elements type and theme of Skema to 'Progress' for processing 
            if (type == 'Sequence') {elements = $('svg g.title, svg g.actor, svg g.signal');}
            else if (type == 'Flowchart') {elements = $('svg rect.flowchart, svg path.flowchart');}
            else if (type == 'Railroad') {elements = $('svg path').first().add($('svg rect')).add($('svg path').last());}
            else if (type == 'Nodelinks') {elements = $('svg g g g').hover(function() {$(this).hide(100).show(100);});}
            else if (type == 'Scenetree') {draw.clone(); elements = $('button svg path').attr('class','eQuery');};

            //set handle with idle time of user inactivity
            elements.each(function(index) {draw.node(index, this);})
            if (type != 'Scenetree') {elements.click(function() {draw.click(this);});}
            $('body').on('click mousemove keyup', _.debounce(function(){draw.reload(hash);}, 600000));

        }

    },

    click : function(e) {

        //disable click events to avoid interruption
        $('.mypointer').css('pointer-events', 'none');
        draw.svg[type] = $('svg').get(0);

        //Allow diagram to get the occurred index of a given object's 
        var array = ['0', '00', '99', '000', '999', '0000', '9999', '00000', '99999', '000000'];
        n = array.includes($(e).attr("id"));

        //Provide Forward and Backward on Workflows 
        pad = (n)? ((pad == 0)? size - 1 : pad - 1): ((pad + 1 == size)? 0: pad + 1);
        type = json[pad]['title']; draw.getJSON(pad);

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

    getJSON : function(pad=2) {

        //Inject Workflows from getJSON
        var jsonfile = '/feed.json?t=' + $.now();
        $("#json").attr("href", jsonfile);

        $.getJSON(jsonfile).done(function(result){

            if(!type) type = 'Sequence';
            if(!link) link = $('#tautan a').clone();

            var obj = result.items[4].items; size = obj.length;
            style = obj[pad].input.style; skema = obj[pad].input.skema;
            editor.setValue(draw.encode(JSON.stringify(skema, null, 4)));

        });

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
        else {type = 'Sequence'; skema = init; draw.getJSON();}

    },

    query : function() {

        if (!test) {
            var result = "{" + $('#graphiql .resultWrap').text().split("{").pop();
            if (draw.isJSON(result)) {test = !test; draw.click($('.eQuery').last());}
        }

    },

    node : function(i, e) {

        e.id = draw.pad(i);
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

    reload : function(hash) {

        scrollTo(hash); window.stop();
        location.hash = hash; location.reload(true);

    },

    encode : function(val) {

        return val.replace(/\\n/g, "\n")
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
