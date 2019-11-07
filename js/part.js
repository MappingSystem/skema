var part = {

    feed : function(id) {

        var size = 6; var ln = id.length;
        var link = '/skema.json?t=' + $.now();
        if (ln < size) link = '/' + id + link;
        return link;

    }

}
