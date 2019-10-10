$(window).load(function() {draw.diagram();});
$('.theme').change(function() {draw.change();});
$('.download').click(function(ev) {draw.xmlData();});

var editor = ace.edit("editor");
editor.setOptions({fontSize: "10pt"});
editor.setTheme("ace/theme/crimson_editor");
editor.getSession().setMode("ace/mode/asciidoc");
editor.getSession().on('change', _.debounce(function() {draw.diagram();}, 200) );

var draw = {

    kind : [
        { 
            'sequence'  : 'sequence/js/sequence-diagram-snap-min.js',
            'flowchart' : 'flowchart/flowchart-latest.js',
            'railroad'  : 'railroad/railroad-diagrams.js',
            'nodelinks' : 'nodelinks/release/go.js',
            'scenetree' : 'scenetree/build.js'
        }
    ],

    diagram : function() {

        var js;
        var diagram;

        var kinds = draw.kind[0];
        var g = $('.diagram').get(0);

        var select = $(".theme").val();
        var font_size = (select == 'hand')? 13: 14;

        var type = (!draw.type)? 'sequence': draw.type;
        var skema = (draw.skema)? draw.skema: editor.getValue();
        var input = (type != 'sequence')? draw.input: {theme: select, "font-size": font_size};

        _.each(kinds, function(value, key) {
            if (key == type) {

                $(".loadingImg").show();
                js = '/' + value + '?t=' + $.now();
                $('#type').text(type); $('#type')[0].href = '/' + type;

                if (type != 'scenetree') {

                    $('#diagram').show().html('');
                    editor.clearSelection(); editor.gotoLine(1, 1);
                    if (type != 'sequence') $('.diagram').css({'overflow': 'hidden'});

                } else {

                    $('#diagram').hide();
                    $('#viewport').html('<canvas></canvas>');

                }
            }
        });

        $.getScript(js, function( data, textStatus, jqxhr ) {

            try {

                if(type == 'sequence') {diagram = Diagram.parse(skema); diagram.drawSVG(g, input);}
                else if(type == 'flowchart') {diagram = flowchart.parse(skema); diagram.drawSVG(g, input);}
                else if(type == 'railroad') {diagram = eval(skema).format(input); diagram.addTo(g);}
                else if(type == 'nodelinks') {diagram = draw.makeSvg(input, skema); g.prepend(diagram);}
                //else if(type == 'scenetree') {diagram = d3.select(".diagram"); g.prepend(draw.svg['sequence']);}

            } finally {

                draw.type = type; draw.element();
                $('.loadingImg').hide();

            }

        });

    },

    element : function() {

        var elements;
        var type= draw.type;
        var select = $(".theme").val();
        
        if (!$('.diagram').find('svg')[0]) {

            window.requestAnimationFrame(draw.element);

        } else if(select != 'hand') {

            if (type == 'sequence') {elements = $('svg g.title, svg g.actor, svg g.signal');}
            else if (type == 'flowchart') {elements = $('svg rect.flowchart, svg path.flowchart');} 
            else if (type == 'railroad') {elements = $('svg path').first().add($('svg rect')).add($('svg path').last());}
            else if (type == 'nodelinks') {elements = $('svg g g g');}
            else if (type == 'scenetree') {$('.CodeMirror-code').change(function() {draw.change(this);});}
            if(elements) elements.each(function(index) {draw.node(index, this);}).click(function() {draw.click(this);});

        } 
    },

    click : function(e) {

        var kinds = draw.kind[0];
        draw.svg[draw.type] = $('svg').get(0);
        var index = 0; for (key in kinds) {if(key == draw.type) nIndex = index; index++;}

        var n = ['0', '00', '99', '000', '999', '0000', '9999', '00000', '99999'].includes(e.id);
        var itemIndex = (n)? ((nIndex == 0)? index - 1 : nIndex - 1): ((nIndex + 1 == index)? 0: nIndex + 1);
        draw.type = _.findKey(kinds, function(item) {return _.indexOf(Object.values(kinds), item) == itemIndex;});

        var jsonfile = '/assets/feed.json?t=' + $.now();
        jsonfile = jsonfile.replace('assets', e.id);
        $("#json").attr("href", jsonfile);

        $.getJSON(jsonfile).done(function(result){

            var obj = result.items[4].items[itemIndex];
            draw.input = obj.input; draw.skema = draw.encode(obj.query);
            if(itemIndex != index - 1) editor.setValue(draw.skema);
            else {$(".theme").val("simple"); draw.change();}

        });

    },

    makeSvg : function(input, skema) {

        var $ = go.GraphObject.make;
        var myDiagram = $(go.Diagram, "viewport");
        myDiagram.model = new go.GraphLinksModel(input[0].node, input[1].link);

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
        var svg = $(".diagram").find('svg')[0];
        var width = parseInt(svg.width.baseVal.value);
        var height = parseInt(svg.height.baseVal.value);
        var xmldata = '<?xml version="1.0" encoding="utf-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd"><svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" xmlns:xlink="http://www.w3.org/1999/xlink"><source><![CDATA[' + draw.skema + ']]></source>' + svg.innerHTML + '</svg>';
        a.attr("download", "diagram.svg"); 
        var xml = encodeURIComponent(xmldata);
        a.attr("href", "data:image/svg+xml," + xml);

    },

    encode : function(data) {

        return data.replace(/&apos;/g, "'")
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

    change : function() {

        var regex = /[?&]([^=#]+)=([^&#]*)/g, url = window.location.href, params = {}, match;
        while(match = regex.exec(url)) {params[match[1]] = match[2];}
        draw.params = params;
        draw.diagram();

    },

    node : function(i, e) {

        e.id = draw.pad(i, 2);
        e.parentNode.appendChild(e);
        $(e).css({'cursor':'pointer'});
        $(e).mouseenter(function(){$(this).css('fill','teal')})
            .mouseout(function(){$(this).css('fill','')});

    },

     pad : function(data, size) {

        var s = String(data);
        while (s.length < (size || 2)) {s = "0" + s;}
        return s;

    },

    svg : {}

}
