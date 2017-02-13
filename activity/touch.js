;(function($) {
    $.extend($.fn, {
        sSlide: function(options) {
            var defaults = {
                slideElem: 'li',   //执行滑动的元素
                minMove: 30,   //最小滑动距离
                moveSpeed: 300,  //滑动速度
                arrow: ["down"],  //上: up, 下: down, 左: left, 右:right, 无:false
                direction: 'X',  // 左右: X, 上下: Y
                loop: false,   //是否循环
                subNav: false,  //是否有页面标签
                skipSelectors: ['a'],   // 如果在这些元素上点击，则不执行slide
                slidesWidth: document.documentElement.clientWidth,  
                slidesHeight: document.documentElement.clientHeight,
                pagination: [],  //执行特殊事件的页码
                pageEvents: [
                    
                ]
            };
            var settings    = $.extend(defaults, options);
            var sSlideObj   = $(this.selector);
            var slides      = sSlideObj.children(settings.slideElem);
            var slidesLen   = slides.length;
            var slidesWidth = settings.slidesWidth;
            var slidesHeight = settings.slidesHeight;
            var minMove     = settings.minMove; //最小移动距离，超出才执行滑动
            var moveSpeed   = settings.moveSpeed;
            var direction   = settings.direction;
            var arrow       = settings.arrow;
            var loop        = settings.loop;
            var movement    = direction == 'X' ? slidesWidth : slidesHeight;
            var fullWidth   = direction == 'X' ? slidesWidth * (slidesLen + (loop ? 2 : 0)): slidesWidth;
            var fullHeight  = direction == 'X' ? slidesHeight : slidesHeight * (slidesLen + (loop ? 2 : 0));
            var curIndex    = loop ? 1 : 0;
            var isMoving    = false;
            var subNav = settings.subNav;
            var pagination = settings.pagination;
            var pageEvents = settings.pageEvents;

            var translateStr = function(offset) {
                var str;
                if (direction == 'X') {
                    str = "translateX(";
                } else {
                    str = "translateY(";
                }
                return str += offset + "px)";
            };
            var getPoint = function(touch) {
                return direction == 'X' ? touch.pageX : touch.pageY;
            };
            var flipPage = function(dir) {
                curIndex += dir;
                if (curIndex > slidesLen + 1) {
                    curIndex = 2;
                } else if (curIndex < 0) {
                    curIndex = loop ? slidesLen - 1 : 0;
                } else if (curIndex == slidesLen) {
                    curIndex = loop ? curIndex : curIndex - dir;
                }
            }

            var doTransform = function(obj, offset, speed){
                sSlideObj.animate({"-webkit-transform": translateStr(offset)}, speed, 'ease', function() {
                    if (loop) {
                        if (curIndex == slidesLen +　1) {
                            sSlideObj.css({"-webkit-transform": translateStr(-movement)});
                            curIndex = 1;
                        } else if (curIndex == 0) {
                            sSlideObj.css({"-webkit-transform": translateStr(-slidesLen * movement)});
                            curIndex = slidesLen;
                        }
                    }
                });
            };
            
            var touchEvents = {
                 start: function(e) {
                    var selectors = settings.skipSelectors;
                    for (var idx in selectors) {
                        var target = e.target,
                            selector = selectors[idx];
                        if ($(target).is(selector)) {
                            return true;
                        }
                    };
                    startPoint = getPoint(e.touches[0]);
                    curIndex = $(this).index();
                    return false;
                },
                move: function(e){
                    isMoving = true;
                    e.stopPropagation();
                    e.preventDefault();
                    nowPoint   = getPoint(e.touches[0]);
                    moveSpace  = nowPoint - startPoint;
                    var offset = -curIndex * movement + moveSpace;
                    if(curIndex == slidesLen-1 && moveSpace < 0) {   //禁止最后一页上滑
                    } else {
                        sSlideObj.css({'-webkit-transform': translateStr(offset), '-webkit-transition':'ms linear'});
                    }
                    return false;
                },
                end: function(e) {
                    if (!isMoving) {
                      var anchors = $(e.target).parent('a');
                      if (anchors.length == 1) {
                        var anchor = anchors[0];
                        window.location.href = anchor.href;
                      }
                      return true;
                    }
                    var oldIndex = curIndex;
                    if (moveSpace < -minMove) { // move down
                        flipPage(1);
                    } else if(moveSpace > minMove){ // move up
                        flipPage(-1);
                    }
                    if (loop) {
                        slides.find(".animated").removeClass("in");
                        $(".sub-nav .icon").removeClass('active');
                        if (curIndex == slidesLen + 1) {
                            slides.eq(0).find('.animated').addClass('in');
                            $(".sub-nav .icon").eq(0).addClass('active');
                        } else {
                            slides.eq(curIndex-1).find('.animated').addClass('in');
                            $(".sub-nav .icon").eq(curIndex-1).addClass('active');
                        };
                    } else {
                        if (curIndex != oldIndex && curIndex >= 0 && curIndex < slidesLen) {
                            slides.find(".animated").removeClass("in");
                            slides.eq(curIndex).find(".animated").addClass("in");
                            $(".sub-nav .icon").removeClass('active');
                            $(".sub-nav .icon").eq(curIndex).addClass('active');
                        }
                        // Hide arrows
                        if (arrow && curIndex == slidesLen - 1) {
                            $('.sslide-wrapper .arrow.down').hide();
                        } else {
                            $('.arrow').show();
                        }
                    }
                    //page events
                    for (var i = 0; i < slidesLen; i++) {
                        var p = loop ? pagination[i] : pagination[i]-1;
                        if (curIndex == p) {
                            pageEvents[i]();
                        };                  
                    };
                    offset = -curIndex * movement;
                    doTransform(sSlideObj, offset, moveSpeed);
                    moveSpace = 0;
                    isMoving = false;
                    return false;
                }
            };

            var startEvents = function(){
                sSlideObj.css({
                    "-webkit-transform": translateStr(loop ? -movement : 0),
                    position: 'relative',
                    width: fullWidth,
                    height: fullHeight,
                });

                sSlideObj.wrap('<div class="sslide-wrapper"></div>').parent().css({
                    width: slidesWidth,
                    height: slidesHeight,
                    position: 'relative',
                    overflow: 'hidden'
                });

                sSlideObj.children(settings.slides).css({
                    height: slidesHeight,
                    width: slidesWidth
                }).addClass(direction == 'X' ? 'x' : '');

                if (loop) {
                    // init clone
                    var startPoint, nowPoint, moveSpace;
                    var cloneHead = $('.page').eq(0).clone().addClass('clone');
                    cloneHead.appendTo(sSlideObj.selector);
                    var cloneTail = $('.page').eq(slidesLen - 1).clone().addClass('clone');
                    cloneTail.prependTo(sSlideObj.selector);
                }
                //sub-nav clone
                if (subNav) {
                    $('.sslide-wrapper').append("<div class='sub-nav'><em class='icon'></em></div>");
                    for (var i = 0; i < slidesLen; i++) {
                        var cloneSubNav = $(".sub-nav .icon").eq(0).clone();
                        cloneSubNav.prependTo('.sub-nav');
                        console.log(i)
                    };
                    $(".sub-nav .icon").first().addClass('active');
                    $(".sub-nav .icon").last().remove();
                } ;

                if (arrow.length > 0) {
                    for (var i = 0; i < arrow.length; i++) {
                        sSlideObj.after('<span class="arrow ' + arrow[i] + '"></span>');
                    };
                }

                $('.arrow', '.sslide-wrapper').on('click', function(a,b,c) {
                    var arrow = $(this);
                    if (arrow.hasClass('right') || arrow.hasClass('down')) {
                        flipPage(1);
                    } else if (arrow.hasClass('left') || arrow.hasClass('up')) {
                        flipPage(-1);
                    }
                    var offset = -curIndex * movement;
                    doTransform(sSlideObj, offset, moveSpeed);
                });

                slides.bind('touchstart',touchEvents.start);
                slides.bind('touchmove',touchEvents.move);
                slides.bind('touchend',touchEvents.end);
                loop ? slides.eq(curIndex - 1).find(".animated").addClass("in") : slides.eq(curIndex).find(".animated").addClass("in");
                for (var i = 0; i < pagination.length; i++) {
                    pagination[i] == 1 ? pageEvents[i]() : false;
                };
            }();
            
        }
    });
})(Zepto);
