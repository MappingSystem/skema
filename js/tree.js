var tree = {

    feed : function(id, size) {

        // Accessing React Internal Instance
        // https://szhshp.org/tech/2019/08/10/reactindepthrender.html
        // https://dev.to/carlmungazi/a-journey-through-reactdom-render-302c
        console.dir(document.getElementById('graphiql')._reactRootContainer._internalRoot);
        let key = Object.keys(dom).find(key=>key.startsWith("__reactInternalInstance$"));
        draw.getJSON();

    }

}
