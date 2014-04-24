define(['knockout', 'underscore', 'jquery'], function(ko, _, $){
    return function ChordPracticeViewModel() {
        var self = this;
        var ROOT_NOTES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

        function createChordTable(chords) {
            // map chords by name
            var byName = {};
            _.each(chords, function (chord) { byName[chord.name] = chord; });
            var chordKeys = ROOT_NOTES;
            var chordTypes = ['', 'm', '7', 'maj7'];
            var table = _.map(chordKeys, function(key) {
                return _.map(chordTypes, function(chordType) {
                    var name = key + chordType;
                    return byName[name];
                });
            });
            return table;
        }

        var chordNames = ['A7', 'A', 'Am', 'B7', 'C', 'C7', 'D', 'Dm', 'D7', 'E', 'Em', 'E7', 'F', 'Fmaj7', 'G', 'G7'];
        self.chords = _.map(chordNames, function(name) {
            return {
                name: name,
                filename: name.toLowerCase() + '.mp3',
                selected: ko.observable(true),
            };
        });
        self.chordTable = createChordTable(self.chords);
        self.columnNames = ['major', 'minor', '7', 'maj7'];
        self.rowNames = _.map(ROOT_NOTES, function(root) {
            return root + ' chords';
        });

        self.repetitionN = ko.observable(3);
        self.sequenceLength = 4;
        self.randomSequence = ko.observable([]);
        self.isSequenceVisible = ko.observable(false);
        self.playerSrc = ko.observable();
        self.isSingleChord = ko.observable(true);
        self.isChordSequence = ko.observable(false);
        self.sequenceString = ko.observable('');
        self.progressPos = ko.observable(0);
        self.isPlaying = ko.observable(false);

        self.selectAll = ko.computed({
            read: function() {
                // return true iff all chords are selected
                return _.all(self.chords, function (chord) {
                    return chord.selected();
                });
            },
            write: function(val) {
                _.each(self.chords, function (chord) {
                    chord.selected(val);
                });
            }
        });
        self.selectRow = _.map(self.chordTable, function(row) {
            return ko.computed({
                read: function() {
                    var ret = _.all(row, function(chord) {
                        var ret = !chord || chord.selected();
                        return ret;
                    });
                    return ret;
                },
                write: function(val) {
                    _.each(row, function (chord) {
                        if (chord) {
                            chord.selected(val);
                        }
                    });
                }
            });
        });
        self.selectCol = _.map(self.chordTable[0], function(col, index) {
            return ko.computed({
                read: function () {
                    return _.all(self.chordTable, function (row) {
                        return !row[index] || row[index].selected();
                    });
                },
                write: function (val) {
                    _.each(self.chordTable, function (row) {
                        if (row[index]) {
                            row[index].selected(val);
                        }
                    });
                }
            });
        });

        self.clickPlayPause = function clickPlayPause() {
            if (self.isPlaying()) {
                setPausedState();
            } else {
                setPlayingState();
            }
        };

        self.clickGenerate = function clickGenerate() {
            setInitialState();
            setPlayingState();
        };

        self.clickReveal = function clickReveal() {
            self.isSequenceVisible(true);
        };

        self.onTypeSingleChordClicked = function onTypeSingleChordClicked() {
            self.isSingleChord(true);
            self.isChordSequence(false);
            setInitialState();
        };

        self.onTypeChordSequenceClicked = function onTypeChordSequenceClicked() {
            self.isSingleChord(false);
            self.isChordSequence(true);
            setInitialState();
        };

        self.toggleSelect = function toggleSelect(selector) {
            selector(!selector());
            setInitialState();
        };

        self.onRepetitionN = function onRepetitionN() {
            setInitialState();
        };

        function getSelectedChords(chords) {
            var selected = [];
            for (var i = 0; i < chords.length; ++i) {
                if (chords[i].selected()) {
                    selected.push(chords[i]);
                }
            }
            return selected;
        }

        function pickRandom(chords) {
            var n = chords.length;
            var chordN = Math.floor((Math.random() * n));
            return chords[chordN];
        }

        function getPlayer() {
            return document.getElementById('player');
        }

        function regenerateSequence() {
            var chords = getSelectedChords(self.chords);
            if (chords.length == 0) {
                return;
            }
            var sequence = [];
            var seqString = '';
            self.isSequenceVisible(false);
            if (self.isSingleChord()) {
                var randomChord = pickRandom(chords);
                seqString = randomChord.name;
                sequence = _.times(self.repetitionN(), function (){
                    return randomChord;
                });
            } else {
                for (var i = 0; i < self.sequenceLength; ++i) {
                    var chord = pickRandom(chords);
                    if (i == 0) {
                        seqString = chord.name;
                    } else {
                        seqString += '->' + chord.name;
                    }
                    _.times(self.repetitionN(), function(){
                        sequence.push(chord);
                    });
                }
            }
            self.randomSequence(sequence);
            self.sequenceString(seqString);
            self.curChord = 0;
        };

        function setInitialState() {
            getPlayer().pause();
            self.progressPos(0);
            self.isPlaying(false);
            regenerateSequence();
            initPlayer();
        }

        function setPlayingState() {
            getPlayer().play();
            self.isPlaying(true);
        }

        function setPausedState() {
            getPlayer().pause();
            self.isPlaying(false);
        }

        function setFinishedPlayingState() {
            getPlayer().pause();
            self.curChord = 0;
            initPlayer();
            self.isPlaying(false);
        }

        function onPlayerEnded() {
            self.curChord += 1;
            if (self.curChord < self.randomSequence().length) {
                initPlayer();
                getPlayer().play();
            } else {
                setFinishedPlayingState();
            }
        };

        function onPlayerTimeUpdate(event) {
            var player = event.target;
            var segLength = 1/self.randomSequence().length;
            var p = (self.curChord +player.currentTime/3) * segLength * 100;
            self.progressPos(Math.floor(p));
        };

        function initPlayer() {
            // update player source and setup callback
            self.playerSrc('static/wav/' +
                           self.randomSequence()[self.curChord].filename);
            // for the next chord in sequence
            getPlayer().addEventListener('ended', onPlayerEnded);
            getPlayer().addEventListener('timeupdate', onPlayerTimeUpdate);
        };

        // hack to make the type button pressed on load. Subsequent changes are
        // handled by bootstrap
        $("#type_single_chord_button").addClass("active");

        // We want random sequence to be initialized with something on page load,
        // so that we don't have to mess with greying out play and reveal buttons
        setInitialState();
    };
});
