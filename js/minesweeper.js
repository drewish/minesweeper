var minesweeper;
(function ($) {
  'use strict';
  var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';

  minesweeper = {
    // Configuring these properties controls how the board is built.
    mines: 10,
    rows: 8,
    cols: 8,

    buildBoard: function buildBoard() {
      // Try building the DOM elements hidden to see if that speeds
      // things up.
      var i, j, table = '<table>';
      for (i = 1; i <= minesweeper.rows; i++) {
        table += '<tr>';
        for (j = 1; j <= minesweeper.cols; j++) {
          table += '<td id="c' + j + '_' + i + '" class="covered"></td>';
        }
        table += '</tr>';
      }
      table += '</table>';
      $('#board')
        .html(table)
        .on('click', 'td', minesweeper.cellClickHandler);
      minesweeper.resetBoard();
    },
    resetBoard: function resetBoard() {
      var $tiles = $('td'),
        tl = new TimelineLite();

      $('#menu').fadeOut(400, function () {
        $('#new,#verify').hide();
        $('#cheat').show();
        $('#menu').fadeIn();
      });

      $tiles.addClass('invisible')
        .last().one(transitionEnd, function(e) {
          $('#board').removeClass('playing win loss');
          $tiles
            .removeClass('mine empty adjacent')
            .addClass('covered')
            .html('&nbsp');
          minesweeper.plantMines();

          $tiles.removeClass('invisible');
        })
        ;
    },
    plantMines: function plantMines() {
      $(minesweeper.pickRandomTiles(minesweeper.mines)).addClass("mine");

      // Zero the counts on non-mines.
      $('td:not(.mine)').addClass('empty').text('0');

      // Find adjacent non-mine cells and increment their counts.
      $('td.mine')
        .each(function () {
          minesweeper.adjacentTiles(this.id).not('.mine')
            .removeClass('empty')
            .addClass('adjacent')
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
    revealEnd: function (success) {
      var tl = new TimelineLite(),
        $tiles = $('.covered');

      $('#new,#cheat,#verify').fadeOut(400, function () {
        $('#new').fadeIn();
      });

      $tiles.last().one(transitionEnd, function(e) {
        if (success) {
          $('#board').addClass('win');
          $('.mine').text("✓");
        }
        else {
          $('#board').addClass('loss');
          $('.mine').text("✹");
        }
        $tiles.removeClass('covered invisible');
      }).addClass('invisible');
      //tl.staggerTo($tiles, 0.5, {css: {opacity: 1}}, 1 / $tiles.length);
    },
    cellClickHandler: function cellClickHandler(event) {
      event.preventDefault();

      // Assumes that this is a td element.
      var tl = new TimelineLite(),
        $board = $('#board'),
        $tile = $(this);

      // TODO: it would be nice to defer planting the bombs until here
      // so that we could avoid having them die on a first click.
      if (!$board.hasClass('playing')) {
        $board.addClass('playing');
        $('#new,#verify').fadeIn();
      }

      if ($tile.hasClass('covered')) {
        $tile
          .addClass('invisible')
          .one(transitionEnd, function(e) {
  // TODO why to check this?
              $tile.removeClass('covered');
              if ($tile.hasClass('mine')) {
                // TODO: It would be good if we distinguished the mine
                // they clicked on from the rest.
                minesweeper.revealEnd(false);
              }
              else if ($tile.hasClass('empty')) {
                minesweeper.adjacentTiles($tile.attr('id'))
                  .filter('.covered')
                  .click();
              }
            $tile.removeClass('invisible');
          })
          ;
        }

    },
    newClickHandler: function newClickHandler(event) {
      event.preventDefault();
      minesweeper.resetBoard();
    },
    verifyClickHandler: function verifyClickHandler(event) {
      event.preventDefault();
      minesweeper.revealEnd($('.covered').length === $('.mine').length);
    },
    cheatClickHandler: function cheatClickHandler(event) {
      event.preventDefault();
      // Try to find an empty title at first...
      var tiles = minesweeper.pickRandomTiles(1, ".covered.empty");
      if (!tiles.length) {
        // ...but we'll settle for a safe tile.
        tiles = minesweeper.pickRandomTiles(1, ".covered:not(.mine)");
      }
      $(tiles).click();
      $('#title').text('Mine Cheater');
    }
  };
}(jQuery));

jQuery(document).ready(function () {
  'use strict';
  // TODO: I need to figure out a nice UI for exposing these links.
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

  jQuery('#new').on('click', 'a', minesweeper.newClickHandler);
  jQuery('#verify').on('click', 'a', minesweeper.verifyClickHandler);
  jQuery('#cheat').on('click', 'a', minesweeper.cheatClickHandler);
});