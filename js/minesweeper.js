var minesweeper;
$(document).ready(function () {
    'use strict';
    minesweeper = {
        // Configuring these properties controls how the board is built.
        mines: 10,
        rows: 8,
        cols: 8,

        buildBoard: function buildBoard() {
            // Try building the DOM elements hidden to see if that speeds
            // things up.
            var table = '<table class="hidden">',
                sprites = '',
                i, j, pos;
            for (i = 1; i <= minesweeper.rows; i++) {
                table += '<tr>';
                for (j = 1; j <= minesweeper.cols; j++) {
                    pos = j + '_' + i;
                    table += '<td id="c' + pos + '" class="covered"></td>';
                    sprites += '<div id="s' + pos + '"  class="hidden sprite"></div>';
                }
                table += '</tr>';
            }
            table += '</table>';
            $('#board').html(table).removeClass('hidden');
            $('#center').append(sprites);
            // Put the sprites on top of the tiles
            $('.sprite').removeClass('hidden').each(function () {
                var $cell =  $('#' + this.id.replace('s', 'c')),
                    pos = $cell.position();
                $(this).css({
                    // We have to account for the border here. I wish it wasn't
                    // hard coded...
                    width: $cell.outerWidth() + 1,
                    height: $cell.outerHeight() + 1,
                    left: pos.left,
                    top: pos.top
                });
            });

            $('#board').on('click', 'td', minesweeper.cellClickHandler);
            minesweeper.resetBoard();
        },
        resetBoard: function resetBoard() {
            var $board = $('#board'),
                $sprites = $('.sprite'),
                interval = 1 / $sprites.length,
                tl;

            $board.css({opacity: 0}).removeClass('playing win loss');
            $sprites.css({opacity: 0}).show();

            tl = new TimelineLite();
            tl.staggerTo($sprites, 0.5, {css: {opacity: 1}}, interval, 0);
            tl.to($board, 0.5, {css: {opacity: 1}});
            tl.staggerTo($sprites, 0.5, {css: {opacity: 0}}, interval, -1);
            tl.call(function () {
                $sprites.hide();
            });

            $('#menu').fadeOut(400, function () {
                $('#new,#verify').hide();
                $('#cheat').show();
                $('#menu').fadeIn();
            });

            // Clear everything out.
            $('#board td')
                .removeClass('mine empty')
                .addClass('covered')
                .html('&nbsp');

            minesweeper.plantMines();
        },
        plantMines: function plantMines() {
            $(minesweeper.pickRandomTiles(minesweeper.mines)).addClass("mine");

            // Zero the counts on non-mines.
            $('td:not(.mine)').addClass('empty').text('0');

            $('td.mine')
                // Find adjacent non-mine cells and increment their counts.
                .each(function () {
                    minesweeper.adjacentTiles(this.id).not('.mine')
                        .removeClass('empty')
                        .text(function (index, text) { return +text + 1;});
                });

            $('td.empty').html('&nbsp');
        },
        // Pick a random tile. You can restrict the pool by passing in a selector.
        pickRandomTiles: function pickRandom(count, selector) {
            // Gather up all the tiles...
            var tiles = $('#board td'),
                counter,
                index,
                results = [];
            // ...apply any filters...
            if (selector) {
                tiles = tiles.filter(selector);
            }
            for (counter = count; counter > 0 && tiles.length; counter--) {
                // ...pick an item randomly...
                index = Math.floor(Math.random() * tiles.length);
                // ...then remove it from the list so we don't pick it again.
                results.push(tiles.splice(index, 1)[0]);
            }

            return results;
        },
        // Given a tiles return the ids of the adjacent tiles.
        adjacentTiles: function adjacentTiles(tileId) {
            // Strip the leading character.
            var adjacent = [],
                pos = tileId.substr(1).split('_'),
                x = +pos[0],
                y = +pos[1],
                left = (x > 1) ? x - 1 : x,
                up = (y > 1) ? y - 1 : y,
                right = (x < minesweeper.cols) ? x + 1 : x,
                down = (y < minesweeper.rows) ? y + 1 : y,
                i,
                j;

            for (i = left; i <= right; i++) {
                for (j = up; j <= down; j++) {
                    // Don't put the current cell in there.
                    if (i !== x || j !== y) {
                        adjacent.push(document.getElementById("c" + i + '_' + j));
                    }
                }
            }
            // console.log(id, x, y, adjacent);
            return $(adjacent);
        },
        spritesForTiles: function spritesForTiles(tiles) {
            var sprites = [];
            $.each(tiles, function () {
                sprites.push(document.getElementById(this.id.replace('c', 's')));
            });
            return $(sprites);
        },
        endWithLoss: function endWithLoss() {
            $('#board').addClass('loss');
            $('.mine').text("✹");
            minesweeper.revealEnd();
        },
        endWithWin: function endWithWin() {
            $('#board').addClass('win');
            $('.mine').text("✓");
            minesweeper.revealEnd();
        },
        revealEnd: function () {
            var $tiles = $('.covered'),
                $sprites = minesweeper.spritesForTiles($tiles),
                tl;

            $sprites.css({'opacity': 1}).show();
            $tiles.removeClass('covered');

            $('#new,#cheat,#verify').fadeOut(400, function () {
                $('#new').fadeIn();
            });

            tl = new TimelineLite();
            tl.to($sprites, 0.5, {css: {opacity: 0}}, 0, 0, null, function () {
                $sprites.hide();
            });
        },
        cellClickHandler: function cellClickHandler(event) {
            event.preventDefault();

            // Assumes that this is a td element.
            var $board = $('#board'),
                $this = $(this),
                id = this.id,
                $sprites = minesweeper.spritesForTiles([this]);

            // TODO: it would be nice to defer planting the bombs until here
            // so that we could avoid having them die on a first click.
            if (!$board.hasClass('playing')) {
                $board.addClass('playing');
                $('#new,#verify').fadeIn();
            }

            $sprites.css({'opacity': 1}).show();
            $this.removeClass('covered');
            TweenLite.to($sprites, 0.025, {
                css: {opacity: 0},
                onComplete: function () {
                    $sprites.hide();
                    if ($this.hasClass('mine')) {
                        // TODO: It would be good if we distinguished the mine
                        // they clicked on from the rest.
                        minesweeper.endWithLoss();
                    }
                    else if ($this.hasClass('empty')) {
                        minesweeper.adjacentTiles(id).filter('.covered').click();
                    }
                }
            });
        },
        newClickHandler: function newClickHandler(event) {
            event.preventDefault();

            minesweeper.resetBoard();
        },
        verifyClickHandler: function verifyClickHandler(event) {
            event.preventDefault();
            if ($('.covered').length === $('.mine').length) {
                minesweeper.endWithWin();
            }
            else {
                minesweeper.endWithLoss();
            }
        },
        cheatClickHandler: function cheatClickHandler(event) {
            event.preventDefault();
            $('#title').text('Mine Cheater');
            // Try to find an empty title at first...
            var tiles = minesweeper.pickRandomTiles(1, ".covered.empty");
            if (tiles.length === 0) {
                // ...but we'll settle for a safe tile.
                tiles = minesweeper.pickRandomTiles(1, ".covered:not(.mine)");
            }
            $(tiles).click();
        }
    };

    $('#new').on('click', 'a', minesweeper.newClickHandler);
    $('#verify').on('click', 'a', minesweeper.verifyClickHandler);
    $('#cheat').on('click', 'a', minesweeper.cheatClickHandler);

    // TODO: reset and click animations are too slow on the larger sizes
    // so I'm not exposing links to these.
    var m, d;
    switch (window.location.hash || '') {
        case '#large':
            d = 32;
            m = 120;
            break;
        case '#medium':
            d = 16;
            m = 30;
            break;
        default:
            d = 8;
            m = 10;
            break;
    }
    minesweeper.rows = minesweeper.cols = d;
    minesweeper.mines = m;
    minesweeper.buildBoard();
});