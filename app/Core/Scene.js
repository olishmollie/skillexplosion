define(['jquery', 'utils/GameUtils', 'matter-js'], function($, utils, Matter) {

    /*
     * This module represents a scene.
     * A scene is simply a collection of game objects that are grouped together because they exist together
     *
     *
     */

    var Scene = function() {
        this.id = utils.uuidv4();
        this.objects = [];
        this.isScene = true;
    };

    Scene.prototype.initializeScene = function(objOrArray) {
        Matter.Events.trigger(this, 'initialize');
        $.each(this.objects, function(i, obj) {
            if(obj.initialize && !obj.initialized) {
                obj.initialize();
            } else {
                utils.addSomethingToRenderer(obj);
            }
        })
    };

    Scene.prototype.add = function(objOrArray) {
        if(!$.isArray(objOrArray)) {
            objOrArray = [objOrArray];
        }
        $.merge(this.objects, objOrArray);
    };

    Scene.prototype.clear = function() {
        $.each(this.objects, function(i, obj) {
            if(obj.cleanUp) {
                obj.cleanUp();
            } else {
                utils.removeSomethingFromRenderer(obj);
            }
        })
        this.objects = [];
    };

    /*
     * options: {
     *  newScene: scene to transition to
     *  transitionLength: millis
     *
     * }
     */
    Scene.prototype.transitionToScene = function(options) {
        var newScene = null;
        var transitionLength = 1000;
        if(options.isScene) {
            newScene = options;
        } else {
            newScene = options.newScene;
            transitionLength = options.transitionLength || transitionLength;
        }

        this.tint = utils.addSomethingToRenderer('TintableSquare', 'hudText');
        this.tint.position = utils.getCanvasCenter();
        this.tint.tint = 0x000000;
        this.tint.alpha = 0;
        utils.makeSpriteSize(this.tint, utils.getCanvasWH());
        var tintDuration = 50;
        var tintRuns = transitionLength/tintDuration;

        currentGame.addTimer({name: 'tint' + this.id, runs: tintRuns, timeLimit: tintDuration, killsSelf: true, callback: function() {
            this.tint.alpha += 1/tintRuns;
            if(this.tint.alpha > 1) {
                this.tint.alpha = 1;
            }
        }.bind(this), totallyDoneCallback: function() {
            Matter.Events.trigger(this, 'clear');
            this.clear();
            newScene.initializeScene();
            currentGame.addTimer({name: 'untint' + this.id, runs: tintRuns, timeLimit: tintDuration, killsSelf: true, callback: function() {
                this.tint.alpha -= 1/tintRuns;
                if(this.tint.alpha < 0) {
                    this.tint.alpha = 0;
                }
            }.bind(this)})
        }.bind(this)});
    };

    return Scene;
})
