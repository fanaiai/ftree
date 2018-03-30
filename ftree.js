(function(window, $) {
    var option = {
        autoopen: false,
        canadd:true,
        canedit:true,
        candelete:true
    }

    function Ftree($parentdom, data, options) {
        this.option = $.extend(true, option, options);
        this.data = data;
        this.eventlists = {};
        this.$parentdom = $parentdom;
        this.init();
    }
    Ftree.prototype = {
        init: function() {
            this.$treehtml = $('<div class="ftree">' + this._generalHtml(this.data, true) + '</div>');
            this.$parentdom.empty().append(this.$treehtml);
            this._addCommenEvents();
            this._addOptionEvents();
            this._addDefaultEvents();
        },
        _generalSearchHtml:function(){
        	var searchhtml='<div class="ftreesearch"><input type="text" id="ftreekeyword"></div>';
        	return searchhtml;
        },
        _generalHtml: function(data, isparent) {
            var that = this;
            var treehtml = '<ul style="display:' + ((this.option.autoopen || isparent) ? 'block' : 'none') + '">';
            data.forEach(function(v, i) {
                var haschild = false
                var up = '';
                if (v.child && v.child.length > 0) {
                    haschild = true;
                    up = 'up';
                }
                if (that.option.autoopen) {
                    up = haschild && 'down';
                }
                treehtml += '<li class="spirit ' + up + '"><div class="folder spirit"><div class="nodename" data-id="'
                treehtml += (v.id || '') + '" data-ope="'+v.canadd+','+v.canedit+','+v.candelete+'"><span>' + v.name
                treehtml += `</span><div class="ope">
	                        <a class="spirit add"></a>
	                       <a class="spirit edit"></a>
	                        <a class="spirit delete"></a>
	                    </div></div>`;

                if (v.child && v.child.length > 0) {
                    treehtml += that._generalHtml(v.child);
                }
                treehtml += `</div></li>`
            })
            treehtml += '</ul>'
            return treehtml;
        },
        _addCommenEvents: function() {
            var that = this;
            this.$treehtml.click(function(e) {
                e.stopPropagation();
                var $target = $(e.target);
                var $ptarget = $target.parent().parent();
                if ($target.hasClass('up')) {
                    $target.addClass('down').removeClass('up').children('div').children('ul').slideDown(200);
                } else if ($target.hasClass('down')) {
                    $target.removeClass('down').addClass('up').children('div').children('ul').slideUp(200);
                } else if ($target.hasClass('add')) {
                    that._trigger('add', $target, $ptarget || undefined)
                } else if ($target.hasClass('edit')) {
                    that._trigger('edit', $target, $ptarget || undefined)
                }else if ($target.hasClass('delete')) {
                    that._trigger('delete', $target, $ptarget || undefined)
                }else if ($target[0].nodeName=='SPAN') {
                    that._trigger('clickitem', $target, $ptarget || undefined)
                }
            })
            this._addBasicEvents();
        },
        _addBasicEvents: function() {
            var that = this;
            this.$treehtml.find('.nodename').hover(function(e) {
                    var $target = $(e.currentTarget);
            		var opelist=$target.attr('data-ope').split(',');
                    $('.ope').hide();
                    $target.find('.ope').show();
                    that.option.canadd && opelist[0]!="false" && $target.find('.add').css('display','inline-block');
                    that.option.canedit && opelist[1]!="false" && $target.find('.edit').css('display','inline-block');
                    that.option.candelete && opelist[2]!="false" && $target.find('.delete').css('display','inline-block');
                },
                function(e) {
                    var $target = $(e.currentTarget);
                    $target.find('.ope').hide();
                });
            this.$treehtml.find('span').focusout(function(e) {
                var $target = $(e.currentTarget);
                var newname = $target.text();
                that._trigger('rename', $target, newname) && that._trigger('editafter', $target, newname)
                
            })
        },
        _on: function(type, fn) {
            type = type || 'any';
            if (typeof this.eventlists[type] === "undefined") {
                this.eventlists[type] = [];
            }
            this.eventlists[type].push(fn);
        },
        _trigger: function(type, $target, $ptarget) {
            var l = this.eventlists[type].length;
            var returndata;
            for (var i = 0; i < l; i++) {
                returndata=this.eventlists[type][i].call(this, $target, $ptarget);
            }
            return returndata;
        },
        _remove: function(type) {
            if (this.eventlists[type]) {
                this.eventlists[type] = [];
            }
        },
        _addOptionEvents: function() {
            (typeof this.option.onAdd == 'function') && this._on('add', this.option.onAdd);
            (typeof this.option.onEdit == 'function') && this._on('edit', this.option.onEdit);
            (typeof this.option.onDelete == 'function') && this._on('delete', this.option.onDelete);
            (typeof this.option.onRename == 'function') && this._on('rename', this.option.onRename);
            (typeof this.option.beforeDelete == 'function') && this._on('beforedelete', this.option.beforeDelete);
            (typeof this.option.onClickItem == 'function') && this._on('clickitem', this.option.onClickItem);
        },
        _addDefaultEvents: function() {
            this._on('add', this._onAdd);
            this._on('edit', this._onEdit);
            this._on('delete', this._onDelete);
            this._on('editafter', this._onEditafter);
        },
        _onAdd: function($target, $ptarget) {
            var $li = $ptarget.parent().parent();
            if ($ptarget.next('ul').length <= 0) {
                $ptarget.parent().append('<ul></ul>');
            }
            var $newli = $(`<li class="spirit"><div class="folder spirit"><div class="nodename" data-id="11"><span>新节点</span><div class="ope" style="display: none;">
                <a class="spirit add"></a>
               	<a class="spirit edit"></a>
                <a class="spirit delete"></a>
	                    </div></div></div></li>`)
            $ptarget.next('ul').prepend($newli);
            $li.removeClass('up').addClass('down').children('div').children('ul').slideDown(200);
            this.eventlists = {};
            this._addBasicEvents();
            this._addOptionEvents();
            this._addDefaultEvents();
            var $target = $newli.find('span')
            this._trigger('edit', $target, $target.parent())
        },
        _onEdit: function($target, $ptarget) {
            $ptarget.children('span').prop('contenteditable', 'true').focus();
        },
        _onEditafter:function($target,newname){
        	$target.prop('contenteditable', 'false');
        },
        _onDelete: function($target, $ptarget) {
        	var ifdelete=true;
        	ifdelete=this._trigger('beforedelete',$target, $ptarget);
        	ifdelete &&　$ptarget.parent().parent().remove();
        }
    }
    window.Ftree = Ftree;
})(window, jQuery)