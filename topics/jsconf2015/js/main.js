define(function (require) {
    
    require('qtek/shader/buildin');

    
    var codes = {};

    $('pre.prettyprint').each(function () {
        if (this.id) {
            codes[this.id] = this.innerHTML;
        }
    });
    prettyPrint();

    var actions = {

    }

    slides.init('articles', {
        itemClass: 'item',
        actions: actions
    });
});