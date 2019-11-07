var part = {

    feed : function(id, size) {

        var link = '/skema.json?t=' + $.now();
        if (id.length < size) link = '/' + id + link;
        return link;

    }

}
