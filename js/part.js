var part = {

    feed : function(i) {

        var link = '/skema.json?t=' + $.now();
        if (ln < size) link = '/' + id + link;
        return link;

    }

}
