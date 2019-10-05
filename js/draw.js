$(window).load(function() {draw.diagram();});
$('.theme').change(function() {draw.tChange();});
$('.download').click(function(ev) {draw.xmlData();});

var editor = ace.edit("graphiql");
editor.setOptions({fontSize: "10pt"});
editor.setTheme("ace/theme/crimson_editor");
editor.getSession().setMode("ace/mode/asciidoc");
editor.getSession().on('change', _.debounce(function() {draw.diagram();}, 100) );

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

        var kinds = this.kind[0];
        var g = $('.diagram').get(0);
        
        var select = $(".theme").val();
        var font_size = (select == 'hand')? 12: 13;

        var type = (!draw.type)? 'sequence': draw.type;
        var skema = (draw.skema)? draw.skema: editor.getValue();
        var input = (type!='sequence')? draw.input: {theme: select, "font-size": font_size};

        $('.diagram').html(''); $(".loadingImg").show();
        $('#type').text(type); $('#type')[0].href = '/' + type;

        _.each(kinds, function(value, key){if (key == type) {js = '/' + value + '?t=' + $.now();
        if (type == 'scenetree') $(" <canvas></canvas> ").appendTo(".diagram");}});

        $.getScript(js, function( data, textStatus, jqxhr ) {

            try {

                if(type == 'sequence') {

                    diagram = Diagram.parse(skema);
                    diagram.drawSVG(g, input);

                } else if(type == 'flowchart'){

                    diagram = flowchart.parse(skema);
                    diagram.drawSVG(g, input);

                } else if(type == 'railroad'){

                    diagram = eval(skema).format();
                    diagram.addTo(g);

                } else if(type == 'nodelinks'){

                    diagram = draw.makeSvg(input, skema);
                    g.prepend(diagram);

                } else if(type == 'scenetree'){

                    diagram = d3.select("#viewport").append("svg").attr("width", 1).attr("height", 1);
                    diagram.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 1).attr("y2", 1);

                }

            } finally {

                draw.type = type;
                draw.checkReady();

            }

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

    checkReady : function() {

        if (!$('.diagram').find('svg')[0]) {

            window.requestAnimationFrame(draw.checkReady);

        } else {

            $('.chetabahana-skema').height($('.editor').height() + 200);
            $('.editor-wrapper').height($('.editor').height() + 3);
            $('.editor').height($('.diagram').height() - 94);
            $('.loadingImg').hide();

            editor.clearSelection();
            editor.gotoLine(1, 1);

            switch(draw.type) {

                case 'sequence':

                    $('svg g.title').each(function( index ) {
                        this.id = '00';
                    });

                    $('svg g.actor').each(function( index ) {
                        this.id = '1' + (Math.floor(index/2) + 1).toString();
                    });

                    $('svg g.signal').each(function( index ) {
                        this.id = '2' + (index + 1).toString();
                    });

                    draw.elements = $('svg g.title, svg g.actor, svg g.signal');
                    draw.elements.hover(function() {
                        
                        $(this).hide(100).show(100);

                    });

                break;

                case 'flowchart':

                    $(".theme").val("simple");

                    $('svg rect.start-element').each(function() {
                        this.id = '00';
                    });

                    $('svg rect.flowchart, svg path.flowchart').each(function( index ) {
                        this.id = draw.pad(index + 1, 2);
                    });

                    $('svg rect.end-element').each(function() {
                        this.id = '99';
                    });

                    draw.elements = $('svg rect.start-element, svg rect.flowchart, svg path.flowchart, svg rect.end-element');
                    draw.elements.css({'fill-opacity':'0.1'})
                               .mouseenter(function(){$(this).css('fill','teal')})
                               .mouseout(function(){$(this).css('fill','')});

                break;

                case 'railroad':

                    $('svg rect').each(function( index ) {
                        this.id = draw.pad('0' + index, 3);
                    });

                    draw.elements = $('svg rect');
                    draw.elements.css({'fill-opacity':'0.3'})
                               .mouseenter(function(){$(this).css('fill', 'cyan')})
                               .mouseout(function(){$(this).css('fill','')});

                break;

                case 'nodelinks':

                    $('#type')[0].href = 'nodelinks/api/symbols/Diagram.html#makeSvg';

                    $('svg g g g').each(function( index ) {
                        this.id = draw.pad('0' + index, 3);
                    });

                    draw.elements = $('svg g g g');
                    draw.elements.hover(function() {
                        
                        $(this).hide(100).show(100);

                    });

                break;

            }

            draw.elements.css({'cursor':'pointer'})

            .each(function() {

                this.parentNode.appendChild(this);

            })

            .click(function() {

                var kinds = draw.kind[0];
                var index = 0; for (key in kinds) {if(key == draw.type) nIndex = index; index++;}

                var n = ['0', '00', '99', '000', '999'].includes(this.id);
                var itemIndex = (n)? ((nIndex == 0)? index - 1 : nIndex - 1): ((nIndex + 1 == index)? 0: nIndex + 1);;
                draw.type = _.findKey(kinds, function(item) {return _.indexOf(Object.values(kinds), item) == itemIndex;});

                var jsonfile = '/assets/feed.json?t=' + $.now();
                jsonfile = jsonfile.replace('assets', this.id);
                $("#json").attr("href", jsonfile);

                $.getJSON(jsonfile).done(function(result){

                    var obj = result.items[4].items[itemIndex];
                    draw.input = obj.input;
                    draw.skema = draw.encode(obj.query);
                    editor.setValue(draw.skema);

                });

            });

        } 
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

    tChange : function() {

        var regex = /[?&]([^=#]+)=([^&#]*)/g, url = window.location.href, params = {}, match;
        while(match = regex.exec(url)) {params[match[1]] = match[2];}
        this.params = params; console.log(this.params);
        this.diagram();

    },

    pad : function(data, size) {

        var s = String(data);
        while (s.length < (size || 2)) {s = "0" + s;}
        return s;

    }
}
