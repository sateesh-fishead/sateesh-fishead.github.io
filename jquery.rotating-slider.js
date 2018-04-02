(function($){
    $.fn.rotatingSlider = function(options){
        var rotatingSlider = {
            init: function(el){
                this.$slider = $(el);
                this.$slidesContainer = this.$slider.children('ul.slides');
                this.$slides = this.$slidesContainer.children('li');
                this.$clipPath;
                this.$directionControls;

                this.settings = $.extend({
                    autoRotate: false,
                    autoRotateInterval: 6000,
                    draggable: true,
                    directionControls: false,
                    directionLeftText: '&lsaquo;',
                    directionRightText: '&rsaquo;',
                    rotationSpeed: 750,
                    slideHeight : 360,
                    slideWidth : 480,
                }, options);

                this.slideAngle = 360 / this.$slides.length;
                this.listAngle=(this.$slides.length-1) * this.slideAngle;
                this.currentRotationAngle = 0;
                this.autoRotateIntervalId = false;
                this.rotateTimoutId = false;
                this.currentlyRotating = false;
                this.readyToDrag = false;
                this.dragStartPoint;
                this.dragStartAngle;
                this.currentlyDragging = false;
                this.markupIsValid = false;

                this.scrollPoint=$(window).height()/3;
                this.currentScrollPoint=0;
                this.setArray=[];

                this.validateMarkup();
                if(this.markupIsValid){
                    this.renderSlider();
                    this.bindEvents();
                    if(this.settings.autoRotate){
                        this.startAutoRotate();
                    }
                }
            },
            bindEvents: function(){
                if(this.settings.draggable){
                    if($(window).width()>800) {
                        this.$slidesContainer.on('mousedown touchstart', this.handleDragStart.bind(this));
                        this.$slidesContainer.on('mousemove touchmove', this.handleDragMove.bind(this));
                        this.$slidesContainer.on('mouseup mouseleave touchend', this.handleDragEnd.bind(this));
                    }else{
                        this.$slides.on('mousedown touchstart', this.handleDragStart.bind(this));
                        this.$slides.on('mousemove touchmove', this.handleDragMove.bind(this));
                        this.$slides.on('mouseup mouseleave touchend', this.handleDragEnd.bind(this));
                    }
                }
                //if(this.settings.directionControls){
                this.$slider.find('ul.direction-controls .left-arrow button').click(this.handleLeftDirectionClick.bind(this));
                this.$slider.find('ul.direction-controls .right-arrow button').click(this.handleRightDirectionClick.bind(this));
                $(document).on('click','.slides > li[data-point="45"]', this.handleRightDirectionClick.bind(this));
                $(document).on('click','.slides > li[data-point="-45"],.slides > li[data-point="315"]', this.handleLeftDirectionClick.bind(this));
                $(document).on('keyup', this.numtype.bind(this));
                this.$slidesContainer.on('mousewheel', { mousewheel: { debounce: {delay: 300}}, throttle: {delay: 300}}, this.mouseWheel.bind(this));
                //}
            },
            handleDragStart: function(e){
                this.readyToDrag = true;
                this.dragStartPoint = (e.type === 'mousedown') ? e.pageY : e.originalEvent.touches[0].pageY;

            },
            handleDragMove: function(e){
                if(this.readyToDrag){

                    var pageY = (e.type === 'mousemove') ? e.pageY : e.originalEvent.touches[0].pageY;

                    if($(window).width()>800){
                        if(
                            this.currentlyDragging === false &&
                            this.currentlyRotating === false  &&
                            (this.dragStartPoint - pageY > 10 || this.dragStartPoint - pageY < -10)
                        ){
                            this.stopAutoRotate();
                            if(this.settings.directionControls){
                                this.$directionControls.css('pointer-events', 'none');
                            }
                            window.getSelection().removeAllRanges();
                            this.currentlyDragging = true;
                            this.dragStartAngle = this.currentRotationAngle;
                            //console.log('currentROtateAngle: '+ this.currentRotationAngle);
                        }
                        if(this.currentlyDragging){
                            //console.log('dragPos '+(this.dragStartPoint - pageY))
                            this.currentRotationAngle = this.dragStartAngle - ((this.dragStartPoint - pageY) / this.settings.slideWidth * this.slideAngle);
                            //console.log('currentROtateAngle: '+ this.currentRotationAngle);
                            this.$slidesContainer.css('transform', 'translateY(-50%) rotate('+this.currentRotationAngle+'deg)');
                        }
                    }else{
                        if(
                            this.currentlyDragging === false &&
                            this.currentlyRotating === false  &&
                            (this.dragStartPoint - pageY > 10 || this.dragStartPoint - pageY < -10)
                        ){
                            if(this.settings.directionControls){
                                this.$directionControls.css('pointer-events', 'none');
                            }
                            window.getSelection().removeAllRanges();
                            this.currentlyDragging = true;
                            this.dragStartAngle = this.currentScrollPoint;
                        }
                        if(this.currentlyDragging){
                            this.currentScrollPoint = this.dragStartAngle - ((this.dragStartPoint - pageY) / $(window).height() * (this.scrollPoint));
                            this.dragPos=this.dragStartPoint - pageY;

                            this.setArray=[];
                            this.$slides.each(function(i, el){
                                var $slide = $(el);
                                this.setArray.push($slide.attr('data-position'));
                                var thisValue=parseInt(this.setArray[i]);
                                console.log('arrayValue '+this.setArray[i]+' cp '+ (this.dragPos));
                                this.topPos = thisValue - (this.dragPos);
                                $slide.css('top', this.topPos);
                            }.bind(this));
                        }
                    }
                }
            },
            handleDragEnd: function(e){
                this.readyToDrag = false;
                if(this.currentlyDragging){

                    this.currentlyDragging = false;
                    if($(window).width()>800) {
                        console.log('hai '+ this.currentRotationAngle+' hewlo '+this.slideAngle);
                        this.currentRotationAngle = Math.round(this.currentRotationAngle / this.slideAngle) * this.slideAngle;
                        console.log('currentROtateAngle End: '+ this.currentRotationAngle + 'slideAngle '+ this.slideAngle);
                        this.rotate();
                        if (this.settings.directionControls) {
                            this.$directionControls.css('pointer-events', '');
                        }
                    }else{
                        console.log('hai '+ this.currentScrollPoint+' hewlo '+this.scrollPoint);
                        this.scrollCount=Math.round(this.currentScrollPoint / this.scrollPoint);
                        this.currentScrollPoint= Math.round(this.currentScrollPoint / (this.scrollPoint/6)) * (this.scrollPoint/6);

                        console.log('currentROtateAngle End: '+ this.currentScrollPoint + ' slideAngle '+ this.scrollPoint);
                        this.scrollpoints();
                        if (this.settings.directionControls) {
                            this.$directionControls.css('pointer-events', '');
                        }
                    }
                }
            },
            handleLeftDirectionClick: function(e){
                e.preventDefault();
                this.stopAutoRotate();
                this.rotateClockwise();
            },
            handleRightDirectionClick: function(e){
                e.preventDefault();
                this.stopAutoRotate();
                this.rotateCounterClockwise();
            },
            renderSlider: function(){
                var halfAngleRadian = this.slideAngle / 2 * Math.PI/180;
                var innerRadius = 1 / Math.tan(halfAngleRadian) * this.settings.slideWidth / 2;
                var outerRadius = Math.sqrt(Math.pow(innerRadius + this.settings.slideHeight, 2) + (Math.pow((this.settings.slideWidth / 2), 2)));
                upperArcHeight = outerRadius - (innerRadius + this.settings.slideHeight);
                lowerArcHeight = innerRadius - (innerRadius * (Math.cos(halfAngleRadian)));
                var slideFullWidth = (Math.sin(halfAngleRadian) * outerRadius) * 2;
                var slideFullHeight = upperArcHeight + this.settings.slideHeight + lowerArcHeight
                var slideSidePadding = (slideFullWidth - this.settings.slideWidth) / 2;
                var fullArcHeight = outerRadius - (outerRadius * (Math.cos(halfAngleRadian)));
                var lowerArcOffset = (slideFullWidth - (Math.sin(halfAngleRadian) * innerRadius * 2)) / 2;

                /* Set height and width of slider element */
                this.$slider.css('height', this.settings.slideHeight+'px');
                this.$slider.css('width', this.settings.slideWidth+'px');

                /* Set height and width of slides container and offset width*/
                this.$slidesContainer.css('height', innerRadius+'px');
                this.$slidesContainer.css('width', innerRadius+'px');
                this.$slidesContainer.css('margin', '0px');

                /* Offset width and arc height */
                this.$slidesContainer.css('transform', 'translateY(-50%)');
                this.$slidesContainer.css('left', '-'+ upperArcHeight*2 +'px');

                /* Generate path for slide clipping */
                var pathCoords = 'M 0 '+fullArcHeight;
                pathCoords += ' A '+outerRadius+' '+outerRadius+' 0 0 1 '+slideFullWidth+' '+fullArcHeight;
                pathCoords += ' L '+(slideFullWidth-lowerArcOffset)+' '+slideFullHeight;
                pathCoords += ' A '+innerRadius+' '+innerRadius+' 0 0 0 '+lowerArcOffset+' '+slideFullHeight+' Z';
                this.$slider.append('<svg><defs><clipPath id="slideClipPath"><path /></clipPath></defs></svg>');
                this.$slider.find('#slideClipPath>path').attr('d', pathCoords);

                /* Apply styles to each slide */
                this.$slides.each(function(i, el){
                    var $slide = $(el);
                    /* Set distance from point of rotation */
                    $slide.css('transform-origin', 'center '+(innerRadius/2)+'px');

                    /* Set slide Height and Width */
                    //$slide.css('height', this.settings.slideHeight+'px');
                    //$slide.css('width', this.settings.slideWidth+'px');

                    /* Set calculated padding for width, upper arc height, and lower arc height */
                    //$slide.css('padding', upperArcHeight +'px '+slideSidePadding+'px '+lowerArcHeight+'px '+slideSidePadding+'px ');

                    /* Offset container Arc Height */
                    $slide.css('top', upperArcHeight +'px');

                    /* Offset Width, then Rotate Slide, then offset individual Top Arcs  */
                    $slide.css('transform', 'translateY(-50%) rotate('+this.slideAngle * i+'deg) translateX(-'+ 70 +'px)');
                    $slide.attr('data-point', (i * this.slideAngle))
                    /* Add clipping path  */
                    //$slide.css('-webkit-clip-path', 'url(#slideClipPath)');
                    //$slide.css('clip-path', 'url(#slideClipPath)');
                }.bind(this));

                /* Render Arrow Controls */
                if(this.settings.directionControls){
                    var directionArrowsHTML = '<ul class="direction-controls">';
                    directionArrowsHTML += '<li class="left-arrow"><button>'+this.settings.directionLeftText+'</button></li>';
                    directionArrowsHTML += '<li class="right-arrow"><button>'+this.settings.directionRightText+'</button></li>';
                    directionArrowsHTML += '</ul>';
                    this.$slider.append(directionArrowsHTML);
                    this.$directionControls = this.$slider.find('ul.direction-controls');
                }
                if($(window).width()<800){
                    this.$slidesContainer.css('width', '100%');
                    this.$slidesContainer.css('height', ($(window).height() * 1.5)+'px');
                    this.$slidesContainer.css('transform', 'translateY(0%)');
                    this.$slidesContainer.css('left', '0px');
                    //alert(this.$slidesContainer.find('li:last-child').html());

                    this.$slides.each(function(i, el){
                        var $slide = $(el);
                        $slide.css('transform', 'translateY(0) rotate(0deg) translateX(0px)');
                        this.topPos=Math.round(this.scrollPoint)*($slide.index());
                        $slide.css('top',this.topPos)
                        $slide.attr('data-position',this.topPos)
                        this.setArray.push(this.topPos);
                    }.bind(this));
                    //prepending last child
                    this.$slidesContainer.find('li:last-child').css({'top':Math.round('-'+(this.scrollPoint))});
                    this.$slidesContainer.find('li:last-child').attr('data-position', Math.round('-'+(this.scrollPoint)));
                    this.$slidesContainer.find('li:last-child').prependTo(this.$slidesContainer);

                }
            },
            scrollpoints: function(){
                this.currentlyRotating = true;
                if(this.rotateTimeoutId){
                    clearTimeout(this.rotateTimeoutId);
                    this.rotateTimeoutId = false;
                    //console.log('test');

                }
                //console.log('Sateesh '+ this.currentScrollPoint+' hai '+ this.scrollCount);
                //this.currentScrollPoint
                this.currentScrollPoint=Math.round(this.currentScrollPoint);
                this.$slides.css('transition', 'transform '+(this.settings.rotationSpeed)+'s ease-in-out');
                console.log('currentScroll '+Math.round(this.currentScrollPoint));
                if(this.$slidesContainer.attr('currentPos')){
                    if(this.$slidesContainer.attr('currentPos')==this.currentScrollPoint){
                        this.change=false;
                    }else{
                        this.change=true;
                    }
                }
                console.log('currentChange '+ this.$slidesContainer.attr('currentPos')+' hellwo '+ this.currentScrollPoint);
                this.$slides.each(function(i,el){
                    var $slide=$(el);
                    if(this.change == true){
                        if(this.currentScrollPoint < 0 && this.$slidesContainer.attr('currentPos') > this.currentScrollPoint ){
                            this.actualValue = -this.scrollPoint;
                        }else{
                            this.actualValue = this.scrollPoint;
                        }
                        var topValue=parseInt($slide.attr('data-position')) + Math.round(this.actualValue);
                        $slide.css('top',topValue);
                        $slide.attr('data-position',topValue);
                    }else{
                        var topValue=parseInt($slide.attr('data-position'));
                        $slide.css('top',topValue);
                        $slide.attr('data-position',topValue);
                    }
                }.bind(this));
                this.$slidesContainer.attr('currentPos',this.currentScrollPoint);

                this.rotateTimeoutId = setTimeout(function(){
                 this.currentlyRotating = false;
                    this.firstChildPos=this.$slidesContainer.find('li:first-child').attr('data-position');
                    this.lastChildPos=this.$slidesContainer.find('li:last-child').attr('data-position');
                    if(this.firstChildPos==0){
                        this.$slidesContainer.find('li:last-child').css({'top':Math.round('-'+(this.scrollPoint))});
                        this.$slidesContainer.find('li:last-child').attr('data-position', Math.round('-'+(this.scrollPoint)));
                        this.$slidesContainer.find('li:last-child').prependTo(this.$slidesContainer);
                    }
                    if(this.lastChildPos <= (this.scrollPoint*3)){
                        this.$slidesContainer.find('li:first-child').css({'top':Math.round(this.scrollPoint*3)});
                        this.$slidesContainer.find('li:first-child').attr('data-position', Math.round(this.scrollPoint*3));
                        this.$slidesContainer.find('li:first-child').appendTo(this.$slidesContainer);
                    }

                }.bind(this), this.settings.rotationSpeed);
            },
            rotateClockwise: function(){
                var realValue=(this.$slides.length-1) * this.slideAngle;
                this.currentRotationAngle = this.currentRotationAngle + this.slideAngle;
                this.rotate();
                this.$slides.each(function(i, el){
                    var $slide = $(el);
                    $slide.attr('data-point', (parseInt($slide.attr('data-point')) + this.slideAngle))
                    if(parseInt($slide.attr('data-point')) > this.listAngle){
                        $slide.attr('data-point', 0)
                    }


                }.bind(this));
            },
            rotateCounterClockwise: function(){
                var realValue=(this.$slides.length-1) * this.slideAngle;
                this.currentRotationAngle = this.currentRotationAngle - this.slideAngle;
                this.rotate();
                this.$slides.each(function(i, el){
                    var $slide = $(el);
                    $slide.attr('data-point', (parseInt($slide.attr('data-point')) - this.slideAngle))
                    if(parseInt($slide.attr('data-point')) > this.listAngle){
                        $slide.attr('data-point', 0)
                    }
                }.bind(this));
            },
            rotate: function(){
                this.currentlyRotating = true;
                if(this.rotateTimeoutId){
                    clearTimeout(this.rotateTimeoutId);
                    this.rotateTimeoutId = false;
                    //console.log('test');

                }
                this.$slidesContainer.css('transition', 'transform '+(this.settings.rotationSpeed/1000)+'s ease-in-out');
                this.$slidesContainer.css('transform', 'translateY(-50%) rotate('+this.currentRotationAngle+'deg)');
                this.rotateTimeoutId = setTimeout(function(){
                    // console.log('test123');
                    this.currentlyRotating = false;
                    this.$slidesContainer.css('transition', 'none');
                    /* keep currentRotationAngle between -360 and 360 */
                    if(this.currentRotationAngle >= 360 || this.currentRotationAngle <= -360){
                        console.log('rotatePosible');
                        this.currentRotationAngle = this.currentRotationAngle >= 360 ? this.currentRotationAngle - 360 : this.currentRotationAngle + 360;
                        this.$slidesContainer.css('transform', 'translateY(-50%) rotate('+this.currentRotationAngle+'deg)');

                    }
                }.bind(this), this.settings.rotationSpeed);
            },
            startAutoRotate: function(){
                this.autoRotateIntervalId = setInterval(function(){
                    this.rotateCounterClockwise();
                }.bind(this), this.settings.autoRotateInterval);
            },
            stopAutoRotate: function(){
                if(this.autoRotateIntervalId){
                    clearInterval(this.autoRotateIntervalId);
                    this.autoRotateIntervalId = false;
                }
            },
            validateMarkup: function(){
                if(
                    this.$slider.hasClass('rotating-slider') &&
                    this.$slidesContainer.length === 1 &&
                    this.$slides.length >= 2
                ){
                    this.markupIsValid = true;
                }else{
                    this.$slider.css('display', 'none');
                    console.log('Markup for Rotating Slider is invalid.');
                }
            },
            numtype: function(e){

                if ((e.keyCode >= 49 && e.keyCode <= 56) || (e.keyCode >= 97 && e.keyCode <= 104)) {
                    var keyboardValue=e.keyCode;
                    var selectElm=0;
                    var actualValue=0;
                    if((e.keyCode >= 97 && e.keyCode <= 104)){
                        for(var x=97; x <= 104; x++){
                            selectElm++;
                            if(x == keyboardValue){
                                actualValue=selectElm;
                            }
                        }
                    }else{
                        for(var y=49; y <= 56; y++){
                            selectElm++;
                            if(y == keyboardValue){
                                actualValue=selectElm;
                            }
                        }
                    }
                    var thisPos=this.$slidesContainer.children(':nth-child('+actualValue+')').attr('data-point');
                    var rotates=Math.abs(thisPos)/this.slideAngle;
                    var actualValue1=this.$slides.length - rotates;
                    this.rotateinterval=setInterval(function(){
                        this.rotateClockwise();
                        actualValue1--;
                        if(actualValue1==0){
                            clearInterval(this.rotateinterval);
                        }
                    }.bind(this), this.settings.rotationSpeed/1000)

                }else if(e.keyCode == 38 || e.keyCode == 40){
                    if(e.keyCode == 38){
                        this.rotateClockwise();
                    }else{
                        this.rotateCounterClockwise();
                    }
                }
            },
            mouseWheel: function(e, delta){
                var wheelTiming=true;
                var countwheel=0;
                if (wheelTiming == true) {
                    wheelTiming = false;
                    if (delta > 0) {
                        this.rotateCounterClockwise();
                    } else {
                        this.rotateClockwise();
                    }
                }
            }
        }

        return this.each(function(){
            rotatingSlider.init(this);
        });
    };
}(jQuery));