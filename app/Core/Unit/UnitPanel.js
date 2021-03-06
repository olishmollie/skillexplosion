define(['jquery', 'utils/GameUtils', 'matter-js', 'utils/Styles', 'core/Tooltip'], function($, utils, Matter, styles, Tooltip) {

    //This module represents a tile map. This is produced by the tile mapper
    var unitPanel = function(options) {
        this.unitSystem = options.systemRef;
        this.position = options.position;
        this.prevailingUnit = null; //the unit in focus
        this.currentPortrait = null;
        this.selectedUnits = [];
        this.currentAbilities = [];
        this.currentCommands = [];
        this.itemSystem = null;

        this.barOffset = 9; //top bar offset;
        this.centerX = utils.getUnitPanelCenter().x;
        this.centerY = utils.getUnitPanelCenter().y + this.barOffset/2;

        //position variables
        this.unitPortraitPosition = {x: this.centerX, y: this.centerY};

        //unit status variables
        this.unitStatSpacing = 20;
        this.unitStatYOffset = -10;
        this.unitFrameCenterX = this.centerX - 155;
        this.unitNamePosition = {x: this.unitFrameCenterX, y: this.centerY - this.unitStatSpacing + this.unitStatYOffset};
        this.unitLevelPosition = {x: this.unitFrameCenterX, y: this.centerY + this.unitStatYOffset};
        this.unitDamagePosition = {x: this.unitFrameCenterX, y: this.centerY + this.unitStatSpacing + this.unitStatYOffset};
        this.unitArmorPosition = {x: this.unitFrameCenterX, y: this.centerY + this.unitStatSpacing*2 + this.unitStatYOffset};
        this.unitNameText = utils.addSomethingToRenderer('TEXT:--', {position: this.unitNamePosition, where: 'hudOne', style: styles.unitNameStyle});
        this.unitLevelText = utils.addSomethingToRenderer('TEXT:--', {position: this.unitLevelPosition, where: 'hudOne', style: styles.unitLevelStyle});
        this.unitDamageText = utils.addSomethingToRenderer('TEXT:--', {position: this.unitDamagePosition, where: 'hudOne', style: styles.unitDamageStyle});
        this.unitDefenseText = utils.addSomethingToRenderer('TEXT:--', {position: this.unitArmorPosition, where: 'hudOne', style: styles.unitDefenseStyle});

        //experience meter
        this.experienceMeter = utils.addSomethingToRenderer('TintableSquare', {position: {x: 0, y: utils.getPlayableHeight()+1}, anchor: {x: 0, y: 0}, where: 'hudOne'});
        this.experienceMeter.alpha = .5;
        this.experienceMeter.visible = false;

        //health vial
        this.vialDimensions = {w: 24, h: 90};
        this.healthVialCenterY = this.centerY;
        this.healthVialCenterX = this.centerX - 58;
        this.healthVialPosition = {x: this.healthVialCenterX, y: this.healthVialCenterY};
        this.healthVial = utils.addSomethingToRenderer('Vial', {position: this.healthVialPosition, where: 'hudOne'});
        Tooltip.makeTooltippable(this.healthVial, {title: "Health", systemMessage: "--------", descriptionStyle: styles.HPTTStyle, updaters: {mainDescription: function(tooltip) {
            if(this.prevailingUnit) {
                var txt = Math.floor(this.prevailingUnit.currentHealth) + "/" + this.prevailingUnit.maxHealth;
                tooltip.mainDescription.style.fill = utils.percentAsHexColor(this.prevailingUnit.currentHealth/this.prevailingUnit.maxHealth);
            }
            return txt;
        }.bind(this), systemMessage: function() {
            if(this.prevailingUnit)
                var txt = "+" + this.prevailingUnit.healthRegenerationRate + " hp/sec";
            return txt;
        }.bind(this)}})
        utils.makeSpriteSize(this.healthVial, this.vialDimensions);

        this.healthBubbles = utils.getAnimationB({
            spritesheetName: 'bloodswipes1',
            animationName: 'bubbles',
            speed: .9,
            playThisManyTimes: 'loop',
            transform: [this.healthVialPosition.x, this.healthVialPosition.y + 10, 1.5, 1.5],
        });
        utils.makeSpriteSize(this.healthBubbles, {w: 40, h: 80});
        this.healthBubbles.tint = 0xff8080;
        this.healthBubbles.alpha = 1;
        this.healthBubbles.play();
        utils.addSomethingToRenderer(this.healthBubbles, 'hud');

        this.healthVialSquare = utils.createDisplayObject('TintableSquare', {tint: 0x800000, scale: {x: 1, y: 1}, alpha: .8, anchor: {x: .5, y: 1}});
        this.healthVialSquare.position = {x: this.healthVialPosition.x, y: utils.getCanvasHeight()}
        utils.makeSpriteSize(this.healthVialSquare,  {x: 0, y: 0});
        utils.addSomethingToRenderer(this.healthVialSquare, 'hudNOne');

        //energy vial
        this.energyVialCenterY = this.centerY;
        this.energyVialCenterX = this.centerX + 58;
        this.energyVialPosition = {x: this.energyVialCenterX, y: this.energyVialCenterY};
        this.energyVial = utils.addSomethingToRenderer('Vial2', {position: this.energyVialPosition, where: 'hud'});
        Tooltip.makeTooltippable(this.energyVial, {title: "Energy", systemMessage: "+X energy/sec", descriptionStyle: styles.EnergyTTStyle, updaters: {mainDescription: function(tooltip) {
            if(this.prevailingUnit) {
                var txt = Math.floor(this.prevailingUnit.currentEnergy) + "/" + this.prevailingUnit.maxEnergy;
            }
            return txt;
        }.bind(this), systemMessage: function() {
            if(this.prevailingUnit)
                var txt = "+" + this.prevailingUnit.energyRegenerationRate + " energy/sec";
            return txt;
        }.bind(this)}})
        utils.makeSpriteSize(this.energyVial, this.vialDimensions);

        this.energyBubbles = utils.getAnimationB({
            spritesheetName: 'bloodswipes1',
            animationName: 'bubbles',
            speed: .5,
            playThisManyTimes: 'loop',
            transform: [this.energyVialPosition.x, this.energyVialPosition.y + 10, 1.5, 1.5]
        });
        utils.makeSpriteSize(this.energyBubbles, {w: 40, h: 80});
        this.energyBubbles.tint = 0xB6D7F9;
        this.energyBubbles.alpha = .5;
        this.energyBubbles.play();
        utils.addSomethingToRenderer(this.energyBubbles, 'hud');

        this.energyVialSquare = utils.createDisplayObject('TintableSquare', {tint: 0x155194, scale: {x: 1, y: 1}, alpha: .9, anchor: {x: .5, y: 1}});
        this.energyVialSquare.position = {x: this.energyVialPosition.x, y: utils.getCanvasHeight()}
        utils.makeSpriteSize(this.energyVialSquare, {x: 0, y: 0});
        utils.addSomethingToRenderer(this.energyVialSquare, 'hudNOne');

        //unit ability variables
        this.abilitySpacing = 77;
        this.abilityOneCenterX = this.centerX + 185
        this.abilityOneCenterY = this.centerY;

        //basic command variables
        this.commandSpacing = 35;
        this.commandOneCenterX = this.centerX + 413;
        this.commandOneCenterY = this.centerY - 25;

        //selected-group variables
        this.wireframeSize = 32;
        this.groupCenterY = this.centerY;
        this.groupCenterX = 0 + 8 + this.wireframeSize/2;
        this.groupSpacing = 8 + this.wireframeSize;

        //item variables
        this.itemCenterX = this.centerX + 85.5;
        this.itemCenterY = utils.getPlayableHeight() + this.barOffset + 2 /* the 2 is a little buffer area */ + 13;
        this.itemXSpacing = 30;
        this.itemYSpacing = 30;

        //specialty item variables
        this.spItemCenterX = this.centerX - 85.5;
        this.spItemCenterY = utils.getPlayableHeight() + this.barOffset + 2 /* the 2 is a little buffer area */ + 13;
        this.spItemYSpacing = 30;

        //backpack item variables
        this.bpItemCenterX = this.centerX + 408;
        this.bpItemCenterY = this.centerY + 21;
        this.bpItemXSpacing = 30;

        //create frame
        this.frame = utils.createDisplayObject('UnitPanelFrame', {persists: true, position: this.position});
        this.frameBacking = utils.createDisplayObject('TintableSquare', {persists: true, position: this.position, tint: 0x5e5e5b});
        utils.makeSpriteSize(this.frameBacking, {w: utils.getCanvasWidth(), h: utils.getUnitPanelHeight()});
    };

    unitPanel.prototype.initialize = function(options) {

        //add frame-backing to world
        utils.addSomethingToRenderer(this.frameBacking, 'hudNTwo');

        //add frame to world
        utils.addSomethingToRenderer(this.frame, 'hud');

        //listen for when the prevailing unit changes
        Matter.Events.on(this.unitSystem, 'prevailingUnitChange', function(event) {
            this.updatePrevailingUnit(event.unit);
        }.bind(this))

        //listen for item pickup
        if(currentGame.itemSystem) {
            Matter.Events.on(currentGame.itemSystem, 'pickupItem', function(event) {
                if(this.prevailingUnit == event.unit) {
                    this.updateUnitItems();
                }
            }.bind(this))

            Matter.Events.on(currentGame.itemSystem, 'unitUnequippedItem', function(event) {
                if(this.prevailingUnit == event.unit) {
                    event.item.icon.tooltipObj.hide();
                    event.item.icon.visible = false;
                }
            }.bind(this))
        }

        //listen for when the selected group changes
        Matter.Events.on(this.unitSystem, 'selectedUnitsChange', function(event) {
            this.updateUnitGroup(event.orderedSelection);
        }.bind(this))

        Matter.Events.on(this.unitSystem, 'unitSystemEventDispatch', function(event) {
            var abilityTint = 0x80ba80;
            if(this.prevailingUnit.abilities) {
                $.each(this.prevailingUnit.abilities, function(i, ability) {
                    if(ability.key == event.id && ability.type == event.type) {
                        utils.makeSpriteBlinkTint({sprite: ability.icon, tint: abilityTint, speed: 100})
                    }
                }.bind(this))
            }

            if(this.prevailingUnit.commands) {
                var commandTint = 0xa2fa93;
                $.each(this.prevailingUnit.commands, function(name, command) {
                    if(command.key == event.id && command.type == event.type) {
                        if(name == 'attack') {
                            utils.makeSpriteBlinkTint({sprite: this.attackMoveIcon, tint: commandTint, speed: 100});
                        } else if(name == 'move') {
                            utils.makeSpriteBlinkTint({sprite: this.moveIcon, tint: commandTint, speed: 100})
                        } else if(name == 'stop') {
                            utils.makeSpriteBlinkTint({sprite: this.stopIcon, tint: commandTint, speed: 100})
                        } else if(name == 'holdPosition') {
                            utils.makeSpriteBlinkTint({sprite: this.holdPositionIcon, tint: commandTint, speed: 100})
                        }
                    }
                }.bind(this))
            }
        }.bind(this))
    };

    //unit group
    unitPanel.prototype.updateUnitGroup = function(units) {
        this.clearUnitGroup();
        this.selectedUnits = units;
        $.each(this.selectedUnits, function(i, unit) {
            if(unit.wireframe) {
                var wireframe = unit.wireframe;
                if(!wireframe.parent) {
                    utils.addSomethingToRenderer(wireframe, 'hudOne');
                    wireframe.interactive = true;
                    wireframe.on('mouseup', function(event) {
                        this.unitSystem.selectedUnit = unit;
                    }.bind(this))
                }
                wireframe.position = {x: this.groupCenterX + i * this.groupSpacing, y: this.groupCenterY};
                utils.makeSpriteSize(wireframe, this.wireframeSize);
                wireframe.visible = true;
            }
        }.bind(this))

        this.highlightGroupUnit(this.prevailingUnit);
    };


    unitPanel.prototype.clearUnitGroup = function() {
        $.each(this.selectedUnits, function(i, unit) {
            if(unit.wireframe) {
                unit.wireframe.visible = false;
            }
        })
    };

    unitPanel.prototype.highlightGroupUnit = function(prevailingUnit) {
        $.each(this.selectedUnits, function(i, unit) {
            if(unit.wireframe) {
                if(unit == prevailingUnit) {
                    utils.makeSpriteSize(unit.wireframe, this.wireframeSize*1.6);
                } else {
                    utils.makeSpriteSize(unit.wireframe, this.wireframeSize);
                }
            }
        }.bind(this))
    };

    //unit specific display
    unitPanel.prototype.updatePrevailingUnit = function(unit) {

        //flush
        if(this.prevailingUnit)
            this.clearPrevailingUnit();

        //fill
        if(unit) {
            this.prevailingUnit = unit;
            this.displayUnitPortrait();
            this.displayUnitStats();
            this.displayUnitAbilities();
            this.displayCommands();
            this.highlightGroupUnit(unit);
            this.updateUnitItems(unit);
        }
    };

    unitPanel.prototype.clearPrevailingUnit = function() {
        //clear items
        this.clearUnitItems();

        //turn off portrait
        if(this.currentPortrait)
            this.currentPortrait.visible = false;

        //blank out unit stat panel
        this.unitNameText.text = '--';
        this.unitLevelText.text = '--';
        this.unitDamageText.text = '--';
        this.unitDefenseText.text = '--';

        //clear unit ability icons
        if(this.currentAbilities) {
            $.each(this.currentAbilities, function(i, ability) {
                ability.icon.visible = false;
            })
        }
        this.currentAbilities = null;

        //clear commands
        if(this.currentCommands) {
            $.each(this.currentCommands, function(i, command) {
                command.icon.visible = false;
            })
        }

        this.prevailingUnit = null;
    };

    unitPanel.prototype.displayUnitPortrait = function() {
        this.currentPortrait = this.prevailingUnit.portrait;
        if(!this.currentPortrait) return;

        if(!this.currentPortrait.parent) {
            utils.addSomethingToRenderer(this.currentPortrait, 'hudOne');
        } else {
            this.currentPortrait.visible = true;
        }
        utils.makeSpriteSize(this.currentPortrait, 90);
        this.currentPortrait.position = this.unitPortraitPosition;
    };

    unitPanel.prototype.updateUnitItems = function() {
        if(this.prevailingUnit) {
            //regular items
            $.each(this.prevailingUnit.currentItems, function(i, item) {
                if(item == null)
                    return;
                var icon = item.icon;
                icon.alpha = 1;
                var x = i % 2 == 0 ? this.itemCenterX : this.itemCenterX + this.itemXSpacing;
                var yLevel = Math.floor(i / 2);
                var y = this.itemCenterY + this.itemXSpacing * yLevel;
                if(!icon.parent) {
                    utils.addSomethingToRenderer(icon, 'hudOne', {position: {x: x, y: y}});
                    utils.makeSpriteSize(icon, 27);
                } else {
                    icon.position = {x: x, y: y};
                    icon.visible = true;
                }

                if(item.isEmpty) {
                    icon.alpha = 0;
                }
            }.bind(this))

            //specialy items
            $.each(this.prevailingUnit.currentSpecialtyItems, function(i, item) {
                if(item == null)
                    return;
                var icon = item.icon;
                icon.alpha = 1;
                var x = this.spItemCenterX;
                var y = this.itemCenterY + this.spItemYSpacing * i;
                if(!icon.parent) {
                    utils.addSomethingToRenderer(icon, 'hudOne', {position: {x: x, y: y}});
                    utils.makeSpriteSize(icon, 27);
                } else {
                    icon.position = {x: x, y: y};
                    icon.visible = true;
                }

                if(item.isEmpty) {
                    icon.alpha = 0;
                }
            }.bind(this))

            //backpack
            $.each(this.prevailingUnit.currentBackpack, function(i, item) {
                if(item == null)
                    return;
                var icon = item.icon;
                icon.alpha = .5;
                var x = this.bpItemCenterX + this.bpItemXSpacing * i;
                var y = this.bpItemCenterY;
                if(!icon.parent) {
                    utils.addSomethingToRenderer(icon, 'hudOne', {position: {x: x, y: y}});
                    utils.makeSpriteSize(icon, 27);
                } else {
                    icon.position = {x: x, y: y};
                    icon.visible = true;
                }

                if(item.isEmpty) {
                    icon.alpha = 0;
                }
            }.bind(this))
        }
    };

    unitPanel.prototype.clearUnitItems = function() {
        //clear regular items
        if(this.prevailingUnit && this.prevailingUnit.currentItems.length > 0) {
            $.each(this.prevailingUnit.currentItems, function(i, item) {
                if(item) {
                    item.icon.visible = false;
                }
            })
        }

        //clear specialty items
        if(this.prevailingUnit && this.prevailingUnit.currentSpecialtyItems.length > 0) {
            $.each(this.prevailingUnit.currentSpecialtyItems, function(i, item) {
                if(item) {
                    item.icon.visible = false;
                }
            })
        }

        //clear backpack items
        if(this.prevailingUnit && this.prevailingUnit.currentBackpack.length > 0) {
            $.each(this.prevailingUnit.currentBackpack, function(i, item) {
                if(item) {
                    item.icon.visible = false;
                }
            })
        }

        //clear empty slots icons
        if(this.prevailingUnit) {
            $.each(this.prevailingUnit.emptySlots, function(i, emptyItemSlot) {
                emptyItemSlot.icon.visible = false;
            })
        }
    };

    unitPanel.prototype.displayUnitStats = function() {
        //Unit Stats Ticker
        if(!this.updateUnitStatTick) {
            this.updateUnitStatTick = currentGame.addTickCallback(function() {
                if(this.prevailingUnit) {
                    //name
                    this.unitNameText.text = this.prevailingUnit.name || this.prevailingUnit.unitType;

                    //level
                    this.unitLevelText.text = "Lvl: " + this.prevailingUnit.level;

                    //damage
                    this.unitDamageText.text = (this.prevailingUnit.damageLabel || "Dmg: ") + (this.prevailingUnit.damageMember ? this.prevailingUnit[this.prevailingUnit.damageMember] : this.prevailingUnit.damage);

                    //armor
                    this.unitDefenseText.text = "Def: " + this.prevailingUnit.defense;
                }
            }.bind(this));
        }

        //experience meter
        if(!this.updateExperienceMeterTick) {
            this.updateExperienceMeterTick = currentGame.addTickCallback(function() {
                if(this.prevailingUnit) {
                    this.experienceMeter.visible = true;
                    var expPercent = (this.prevailingUnit.currentExperience-this.prevailingUnit.lastLevelExp) / (this.prevailingUnit.nextLevelExp-this.prevailingUnit.lastLevelExp);
                    utils.makeSpriteSize(this.experienceMeter, {x: utils.getPlayableWidth()*expPercent, y: 8});
                } else {
                    this.experienceMeter.visible = false;
                }
            }.bind(this));
        }

        //health vial and engery vial
        if(!this.updateHealthAndEnergyVialTick) {
            this.updateHealthAndEnergyVialTick = currentGame.addTickCallback(function() {
                if(this.prevailingUnit) {
                    this.healthVialSquare.visible = true;
                    this.healthBubbles.visible = true;
                    this.energyVialSquare.visible = true;
                    this.energyBubbles.visible = true;
                    var healthPercent = this.prevailingUnit.currentHealth / this.prevailingUnit.maxHealth;
                    utils.makeSpriteSize(this.healthVialSquare, {x: this.vialDimensions.w, y: this.vialDimensions.h * healthPercent});

                    if(this.prevailingUnit.maxEnergy > 0) {
                        var energyPercent = this.prevailingUnit.currentEnergy / this.prevailingUnit.maxEnergy;
                        utils.makeSpriteSize(this.energyVialSquare, {x: this.vialDimensions.w, y: this.vialDimensions.h * energyPercent});
                    }
                } else {
                    this.healthVialSquare.visible = false;
                    this.healthBubbles.visible = false;
                    this.energyVialSquare.visible = false;
                    this.energyBubbles.visible = false;
                }
            }.bind(this));
        }
    };

    unitPanel.prototype.displayUnitAbilities = function() {
        if(!this.prevailingUnit.abilities) return;

        this.currentAbilities = this.prevailingUnit.abilities;

        //place, scale and enable abilility icons
        $.each(this.currentAbilities, function(i, ability) {
            ability.icon.scale = utils.makeSpriteSize(ability.icon, 61);
            ability.icon.position = {x: this.abilityOneCenterX + (this.abilitySpacing * i), y: this.abilityOneCenterY};
            ability.icon.visible = true;
            if(!ability.icon.parent) {
                utils.addSomethingToRenderer(ability.icon, 'hudOne');
                if(ability.energyCost) {
                  ability.systemMessage = ability.energyCost + ' energy';
                }
                Tooltip.makeTooltippable(ability.icon, ability);
            }
        }.bind(this))

        var unavailableTint = 0x4C4949;
        if(!this.abilityAvailableTick) {
            this.abilityAvailableTick = currentGame.addTickCallback(function() {
                if(this.prevailingUnit) {
                    $.each(this.currentAbilities, function(i, ability) {
                        var enabled = true;
                        if(ability.enablers) {
                            $.each(ability.enablers, function(i, enabler) {
                                enabled = enabler();
                                return enabled;
                            })
                        }
                        if(!enabled) {
                            ability.icon.tint = unavailableTint;
                        } else if(ability.icon.tint == unavailableTint) {
                            ability.icon.tint = 0xFFFFFF;
                        }
                    })
                }
            }.bind(this));
        }
    };

    unitPanel.prototype.displayCommands = function() {
        if(!this.attackMoveIcon) {
            this.moveIcon = utils.addSomethingToRenderer('MoveIcon', 'hudOne', {position: {x: this.commandOneCenterX, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.moveIcon, 25);
            this.currentCommands.push({name: 'attack', icon: this.moveIcon});
            Tooltip.makeTooltippable(this.moveIcon, {title: 'Move', hotkey: 'M', description: "Move to a destination."})

            this.attackMoveIcon = utils.addSomethingToRenderer('AttackIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.attackMoveIcon, 25);
            this.currentCommands.push({name: 'move', icon: this.attackMoveIcon});
            Tooltip.makeTooltippable(this.attackMoveIcon, {title: 'Attack-move', hotkey: 'A', description: "Attack-move to a destination."})

            this.stopIcon = utils.addSomethingToRenderer('StopIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing*2, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.stopIcon, 25);
            this.currentCommands.push({name: 'stop', icon: this.stopIcon});
            Tooltip.makeTooltippable(this.stopIcon, {title: 'Stop', hotkey: 'S', description: "Halt current command."})

            this.holdPositionIcon = utils.addSomethingToRenderer('HoldPositionIcon', 'hudOne', {position: {x: this.commandOneCenterX + this.commandSpacing*3, y: this.commandOneCenterY}});
            utils.makeSpriteSize(this.holdPositionIcon, 25);
            this.currentCommands.push({name: 'holdPosition', icon: this.holdPositionIcon});
            Tooltip.makeTooltippable(this.holdPositionIcon, {title: 'Hold Position', hotkey: 'H', description: "Prevent any automatic movement."})
        } else {
            $.each(this.currentCommands, function(i, command) {
                command.icon.visible = false;
                $.each(this.prevailingUnit.commands, function(j, unitCommand) {
                    if(unitCommand.name == command.name) {
                        command.icon.visible = true;
                    }
                }.bind(this))
            }.bind(this))
        }
    };

    unitPanel.prototype.cleanUp = function() {
        currentGame.removeTickCallback(this.updateUnitStatTick);
        currentGame.removeTickCallback(this.updateHealthAndEnergyVialTick);
        currentGame.removeTickCallback(this.abilityAvailableTick);
    };

    return unitPanel;
})
