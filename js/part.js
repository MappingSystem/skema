var part = {

    feed : function(id, size, data) {

        feed = '/skema.json?t=' + $.now();
        if (id.length < size) feed = '/' + id + feed;

    }

}
