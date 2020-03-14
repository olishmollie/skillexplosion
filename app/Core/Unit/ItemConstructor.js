define(['jquery', 'utils/GameUtils', 'core/Tooltip', 'matter-js', 'utils/Styles', 'pixi'], function($, utils, Tooltip, Matter, styles, PIXI) {

    var baseItem = {
        equip: function(unit) {
            $.each(this.manipulations, function(key, value) {
                unit[key] += value;
            })
        },
        unequip: function(unit) {
            $.each(this.manipulations, function(key, value) {
                unit[key] -= value;
            })
        },
        name: 'generic item name',
        description: 'generic item description',
        icon: 'required'
    }

    var itemDrop = utils.getSound('itempickup.wav', {volume: .04, rate: .75});
    var itemPickup = utils.getSound('itempickup.wav', {volume: .04, rate: 1.2});

    return function(options) {
        var newItem = $.extend({}, baseItem, options);
        newItem.isItem = true;

        //create icon
        newItem.icon = utils.createDisplayObject(options.icon); //note that this icon will not die upon removing the item
        var ctrlClickToDropMessage = '(Ctrl + Click to drop item)';
        newItem.icon.interactive = true;
        Tooltip.makeTooltippable(newItem.icon, {title: newItem.name, description: newItem.description, systemMessage: ctrlClickToDropMessage});

        //cursor change
        newItem.controlDown = function(event) {
            if(event.key == 'Control') {
                if(newItem.mouseInside) {
                    utils.setCursorStyle('server:GenericActionCursor.png');
                }
            }
        }
        newItem.controlUp = function(event) {
            if(event.key == 'Control') {
                if(newItem.mouseInside) {
                    utils.setCursorStyle('server:MainCursor.png');
                }
            }
        }
        window.addEventListener("keydown", newItem.controlDown);
        window.addEventListener("keyup", newItem.controlUp);
        newItem.cursorListener = currentGame.addTickCallback(function() {
            if(!newItem.icon.visible) return;

            var localPoint = newItem.icon.toLocal(new PIXI.Point(currentGame.mousePosition.x, currentGame.mousePosition.y));
            if(newItem.icon.containsPoint(currentGame.renderer.interaction.mouse.global)) {
                if(keyStates['Control']) {
                    utils.setCursorStyle('server:GenericActionCursor.png');
                }
                newItem.mouseInside = true;
            } else {
                if(newItem.mouseInside) {
                    utils.setCursorStyle('server:MainCursor.png');
                }
                newItem.mouseInside = false;
            }
        })

        //drop item
        newItem.icon.on('mousedown', function(event) {
            if(keyStates['Control']) {
                newItem.owningUnit.dropItem(newItem);
                newItem.mouseInside = false;
                utils.setCursorStyle('server:MainCursor.png');
            }
        }.bind(this))

        //create name display (shown upon alt or hover)
        var baseTint = 0x00042D;
        newItem.nameDisplayBase = utils.createDisplayObject('TintableSquare', {tint: baseTint, scale: {x: 1, y: 1}, alpha: .85});
        newItem.nameDisplay = utils.createDisplayObject('TEXT:' + newItem.name, {style: styles.regularItemName})
        utils.makeSpriteSize(newItem.nameDisplayBase, {w: newItem.nameDisplay.width + 15, h: 25});

        newItem.showName = function(bool) {
            if(!this.body) return; //if we've been collected, don't display the name
            if(!newItem.nameDisplay.parent) {
                utils.addDisplayObjectToRenderer(newItem.nameDisplay, 'hudText');
                utils.addDisplayObjectToRenderer(newItem.nameDisplayBase, 'hud')
            }

            newItem.nameDisplayBase.visible = bool;
            newItem.nameDisplay.visible = bool;

            if(bool) {
                newItem.nameDisplayBase.position = {x: newItem.body.position.x, y: newItem.body.position.y - 30};
                newItem.nameDisplay.position = {x: newItem.body.position.x, y: newItem.body.position.y - 30};
            }
        }

        newItem.removePhysicalForm = function() {
            this.showName(false);
            currentGame.removeBody(this.body);
            this.body = null;
        },

        newItem.pickup = function() {
            this.removePhysicalForm();
            itemPickup.play();
        },

        newItem.drop = function(position) {
            //create item body
            this.body = Matter.Bodies.circle(position.x, position.y, 20, {
                isSensor: true
            });

            var item = this;

            //play animation
            this.itemDrop = utils.getAnimationB({
                spritesheetName: 'bloodswipes1',
                animationName: 'ItemDrop',
                speed: 1.2,
                playThisManyTimes: 1,
                transform: [position.x, position.y],
                onComplete: function() {
                    utils.removeSomethingFromRenderer(this);
                    currentGame.addBody(item.body);
                    Matter.Events.trigger(currentGame.itemSystem, 'dropItem', {item: item});
                }
            });

            itemDrop.play();
            utils.makeSpriteSize(this.itemDrop, {w: 60, h: 60});
            this.itemDrop.alpha = .65;
            this.itemDrop.play();
            utils.addSomethingToRenderer(this.itemDrop, 'stage');

            //Make renderlings accessible from wherever
            Object.defineProperty(newItem.body, 'renderlings', {
                get: function() {
                    return newItem.renderlings;
                },
                set: function(v) {
                    newItem.renderlings = v;
                }
            });
            Object.defineProperty(newItem.body, 'renderChildren', {
                get: function() {
                    return newItem.renderChildren;
                }
            });

            newItem.renderChildren = [{
                id: 'itemFootprint',
                data: 'GlassMarble',
                scale: {
                    x: .4,
                    y: .4
                },
                rotate: 'none',
                visible: true,
            },
            {
                id: 'shadow',
                data: 'IsoShadowBlurred',
                scale: {x: .6, y: .6},
                visible: true,
                rotate: 'none',
                stage: "stageNTwo",
                offset: {x: 0, y: 10}
            }];

            newItem.body.item = newItem;
        },

        newItem.destroy = function() {
            this.icon.tooltipObj.destroy();
            utils.removeSomethingFromRenderer(this.nameDisplayBase);
            utils.removeSomethingFromRenderer(this.nameDisplay);
            if(newItem.body) {
                currentGame.removeBody(newItem.body);
            }
            window.removeEventListener('keydown', this.controlDown);
            window.removeEventListener('keyup', this.controlUp);
            currentGame.removeTickCallback(newItem.cursorListener);
        },

        currentGame.addItem(newItem);
        return newItem;
    }
})
