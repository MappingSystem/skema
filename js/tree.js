var tree = {

    feed : function(id, size, data) {

        var queryWrap = $('#graphiql .queryWrap .CodeMirror')[0].CodeMirror;
        queryWrap.setValue(data.skema)

    }

}
