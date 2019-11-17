var part = {

    feed : function(id, size) {

        data = null;
        feed = '/skema.json?t=' + $.now();
        if (id.length < size) feed = '/' + id + feed;
        draw.getJSON();

    }

}
