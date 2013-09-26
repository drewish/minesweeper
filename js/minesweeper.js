var Minesweeper;

(function ($) {
  'use strict';
  var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';

  $.fn.extend({
    afterTransition: function (callback) {
      return this.on(transitionEnd, function(e) {
        $(this).off(transitionEnd);
        callback();
      });
    }
  , staggerTransitions: function() {
      var self = this;
      return self
        .last().afterTransition(function() {
          self.css('transition-delay', 'initial')
        }).end()
        .css('transition-delay', function(i) { return (10 + i * 2) + 'ms'; })
        ;
    }
  });
})(jQuery);

function Minesweeper(mines, rows, cols) {
  // Configuring these properties controls how the board is built.
  this.mine_count = mines || 10;
  this.rows = rows || 8;
  this.cols = cols || 8;
  this.$board = null;
  this.$tiles = null;
  this.buildBoard();
}

Minesweeper.prototype.buildBoard = function buildBoard() {
  // Try building the DOM elements hidden to see if that speeds
  // things up.
  var table = '<table>'
    , self = this
    , i, j
    ;
  for (i = 1; i <= this.rows; i++) {
    table += '<tr>';
    for (j = 1; j <= this.cols; j++) {
      table += '<td id="c' + j + '_' + i + '" class="covered"></td>';
    }
    table += '</tr>';
  }
  table += '</table>';

  this.$board = $('#board')
    .html(table)
    .on('click', 'td', function () {
      event.preventDefault();
      self.revealTile($(this));
    });
  this.$tiles = this.$board.find('td');

  this.resetBoard();
};

Minesweeper.prototype.resetBoard = function resetBoard() {
  var self = this;

  $('#menu').fadeOut(400, function () {
    $('#new,#verify').hide();
    $('#cheat').show();
    $('#menu').fadeIn();
  });

  this.$tiles
    .css('transition-delay', function(i) { return (10 + i * 2) + 'ms'; })
    .last().afterTransition(function() {
      $('#board').removeClass('playing win loss');
      self.$tiles
        .removeClass('mine empty adjacent')
        .addClass('covered')
        ;

      self.plantMines();

      self.$tiles
        .last().afterTransition(function() {
          self.$tiles.css('transition-delay', 'initial')
        }).end()
        .removeClass('invisible');

    }).end()
    .addClass('invisible')
    ;
};

Minesweeper.prototype.plantMines = function plantMines() {
  var self = this
    , $mines = $(this.pickRandomTiles(this.mine_count)).addClass("mine")
    ;

  // Zero the counts on non-mines so we can increment them.
  $('td:not(.mine)').addClass('empty').text('0')

  // Find adjacent non-mine cells and increment their counts.
  $mines.each(function () {
    self.adjacentTiles($(this)).not('.mine')
      .removeClass('empty')
      .addClass('adjacent')
      .text(function (index, text) { return +text + 1;});
  });

  $('td.empty').html('&nbsp');
};

// Pick a random tile. You can restrict the pool by passing in a selector.
Minesweeper.prototype.pickRandomTiles = function pickRandom(count, selector) {
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
};

// Given a tiles return the ids of the adjacent tiles.
Minesweeper.prototype.adjacentTiles = function adjacentTiles($tile) {
  var adjacent = [],
    // Strip the leading character.
    pos = $tile.attr('id').substr(1).split('_'),
    x = +pos[0],
    y = +pos[1],
    left = (x > 1) ? x - 1 : x,
    up = (y > 1) ? y - 1 : y,
    right = (x < this.cols) ? x + 1 : x,
    down = (y < this.rows) ? y + 1 : y,
    i,
    j;

  for (i = left; i <= right; i++) {
    for (j = up; j <= down; j++) {
      // Don't put the current cell in there.
      if (i !== x || j !== y) {
        adjacent.push(document.getElementById('c' + i + '_' + j));
      }
    }
  }
  // console.log(id, x, y, adjacent);
  return $(adjacent);
};

Minesweeper.prototype.revealAll = function () {
  var $board = this.$board
    , $covered = $board.find('.covered')
    , success = $covered.length === this.mine_count
    ;

  $('#new,#cheat,#verify').fadeOut(400, function () {
    $('#new').fadeIn();
  });

  $covered
    .last().afterTransition(function() {
      if (success) {
        $board.addClass('win').find('.mine').text("✓");
      }
      else {
        $board.addClass('loss').find('.mine').text("✹");
      }

      $covered
        .staggerTransitions()
        .removeClass('covered invisible');

    }).end()
    .addClass('invisible')
    ;
};

Minesweeper.prototype.revealTile = function ($tile) {
  var self = this;

  // Bail if the tile isn't covered or is invisible (being removed).
  if (!$tile.hasClass('covered') || $tile.hasClass('invisible')) {
    return;
  }

  // TODO: it would be nice to defer planting the bombs until here
  // so that we could avoid having them die on a first click.
  if (!self.$board.hasClass('playing')) {
    self.$board.addClass('playing');
    $('#new,#verify').fadeIn();
  }

  $tile
    .afterTransition(function() {
      $tile.removeClass('covered');
      if ($tile.hasClass('mine')) {
        // TODO: It would be nice if we distinguished the mine
        // they clicked on from the rest.
        self.revealAll();
      }
      else if ($tile.hasClass('empty')) {
        self.adjacentTiles($tile).filter('.covered').click();
      }
      $tile.removeClass('invisible');
    })
    .addClass('invisible')
    ;
}
