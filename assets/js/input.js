(function($){
	
	
	function initialize_field( $el ) {
		
		//$el.doStuff();

		
	}
	
	
	if( typeof acf.add_action !== 'undefined' ) {
	
		/*
		*  ready append (ACF5)
		*
		*  These are 2 events which are fired during the page load
		*  ready = on page load similar to $(document).ready()
		*  append = on new DOM elements appended via repeater field
		*
		*  @type	event
		*  @date	20/07/13
		*
		*  @param	$el (jQuery selection) the jQuery element which contains the ACF fields
		*  @return	n/a
		*/
		
		acf.add_action('ready append', function( $el ){
			
			// search $el for fields of type 'recent_posts'
			acf.get_fields({ type : 'recent_posts'}, $el).each(function(){
				
				initialize_field( $(this) );
				
			});
			
		});
		
		
	} else {
		
		
		/*
		*  acf/setup_fields (ACF4)
		*
		*  This event is triggered when ACF adds any new elements to the DOM. 
		*
		*  @type	function
		*  @since	1.0.0
		*  @date	01/01/12
		*
		*  @param	event		e: an event object. This can be ignored
		*  @param	Element		postbox: An element which contains the new HTML
		*
		*  @return	n/a
		*/
		
		$(document).on('acf/setup_fields', function(e, postbox){
			
			$(postbox).find('.field[data-field_type="recent_posts"]').each(function(){
				
				initialize_field( $(this) );
				
			});
		
		});
	
	
	}


})(jQuery);

(function($){

	acf.fields.recent_posts = acf.field.extend({

		type: 'recent_posts',

		$el: null,
		$input: null,
		$filters: null,
		$choices: null,
		$values: null,

		actions: {
			'ready':	'initialize',
			'append':	'initialize',
			//'show':		'show'
		},

		events: {
			'keypress [data-filter]': 			'submit_filter',
			'change [data-filter]': 			'change_filter',
			'keyup [data-filter]': 				'change_filter',
			'click .choices .acf-rel-item': 	'add_item',
			'click [data-name="remove_item"]': 	'remove_item'
		},

		focus: function(){

			// get elements
			this.$el = this.$field.find('.acf-recent_posts');
			this.$input = this.$el.find('.acf-hidden input');
			this.$choices = this.$el.find('.choices'),
				this.$values = this.$el.find('.values');

			// get options
			this.o = acf.get_data( this.$el );

		},

		initialize: function(){

			// reference
			var self = this,
				$field = this.$field,
				$el = this.$el,
				$input = this.$input;


			// right sortable
			this.$values.children('.list').sortable({
				items:					'li',
				forceHelperSize:		true,
				forcePlaceholderSize:	true,
				scroll:					true,
				update:	function(){

					$input.trigger('change');

				}
			});


			//this.$choices.children('.list').scrollTop(0).on('scroll', function(e){
            //
			//	// bail early if no more results
			//	if( $el.hasClass('is-loading') || $el.hasClass('is-empty') ) {
            //
			//		return;
            //
			//	}
            //
            //
			//	// Scrolled to bottom
			//	if( Math.ceil( $(this).scrollTop() ) + $(this).innerHeight() >= $(this).get(0).scrollHeight ) {
            //
			//		// get paged
			//		var paged = $el.data('paged') || 1;
            //
            //
			//		// update paged
			//		$el.data('paged', (paged+1) );
            //
            //
			//		// fetch
			//		self.set('$field', $field).fetch();
            //
			//	}
            //
			//});


			/*
			 // scroll event
			 var maybe_fetch = function( e ){
			 console.log('scroll');
			 // remove listener
			 $(window).off('scroll', maybe_fetch);


			 // is field in view
			 if( acf.is_in_view($field) ) {

			 // fetch
			 self.doFocus($field);
			 self.fetch();


			 // return
			 return;
			 }


			 // add listener
			 setTimeout(function(){

			 $(window).on('scroll', maybe_fetch);

			 }, 500);

			 };
			 */


			// fetch
			this.fetch();

		},

		/*
		 show: function(){

		 console.log('show field: %o', this.o.xhr);

		 // bail ealry if already loaded
		 if( typeof this.o.xhr !== 'undefined' ) {

		 return;

		 }


		 // is field in view
		 if( acf.is_in_view(this.$field) ) {

		 // fetch
		 this.fetch();

		 }

		 },
		 */

		maybe_fetch: function(){

			// reference
			var self = this,
				$field = this.$field;


			// abort timeout
			if( this.o.timeout ) {

				clearTimeout( this.o.timeout );

			}


			// fetch
			var timeout = setTimeout(function(){

				self.doFocus($field);
				self.fetch();

			}, 300);

			this.$el.data('timeout', timeout);

		},

		fetch: function(){

			// reference
			var self = this,
				$field = this.$field;


			// add class
			this.$el.addClass('is-loading');


			// abort XHR if this field is already loading AJAX data
			if( this.o.xhr ) {

				this.o.xhr.abort();
				this.o.xhr = false;

			}


			// add to this.o
			this.o.action = 'acf/fields/recent_posts/query';
			this.o.field_key = $field.data('key');
			this.o.post_id = acf.get('post_id');


			// ready for ajax
			var ajax_data = acf.prepare_for_ajax( this.o );


			// clear html if is new query
			if( ajax_data.paged == 1 ) {

				this.$choices.children('.list').html('')

			}


			// add message
			this.$choices.find('ul:last').append('<p><i class="acf-loading"></i> ' + acf._e('recent_posts', 'loading') + '</p>');


			// get results
			var xhr = $.ajax({
				url:		acf.get('ajaxurl'),
				dataType:	'json',
				type:		'post',
				data:		ajax_data,
				success:	function( json ){

					self.set('$field', $field).render( json );

				}
			});


			// update el data
			this.$el.data('xhr', xhr);

		},

		render: function( json ){

			// remove loading class
			this.$el.removeClass('is-loading is-empty');


			// remove p tag
			this.$choices.find('p').remove();


			// no results?
			if( !json || !json.results || !json.results.length ) {

				// add class
				this.$el.addClass('is-empty');


				// add message
				if( this.o.paged == 1 ) {

					this.$choices.children('.list').append('<p>' + acf._e('recent_posts', 'empty') + '</p>');

				}


				// return
				return;

			}


			// get new results
			var $new = $( this.walker(json.results) );


			// apply .disabled to left li's
			this.$values.find('.acf-rel-item').each(function(){

				$new.find('.acf-rel-item[data-id="' +  $(this).data('id') + '"]').addClass('disabled');

			});


			// underline search match
			if( this.o.s ) {

				var s = this.o.s;

				$new.find('.acf-rel-item').each(function(){

					// vars
					var find = $(this).text(),
						replace = find.replace( new RegExp('(' + s + ')', 'gi'), '<b>$1</b>');

					$(this).html( $(this).html().replace(find, replace) );

				});

			}


			// append
			this.$choices.children('.list').append( $new );


			// merge together groups
			var label = '',
				$list = null;

			this.$choices.find('.acf-rel-label').each(function(){

				if( $(this).text() == label ) {

					$list.append( $(this).siblings('ul').html() );

					$(this).parent().remove();

					return;
				}


				// update vars
				label = $(this).text();
				$list = $(this).siblings('ul');

			});


		},

		walker: function( data ){

			// vars
			var s = '';


			// loop through data
			if( $.isArray(data) ) {

				for( var k in data ) {

					s += this.walker( data[ k ] );

				}

			} else if( $.isPlainObject(data) ) {

				// optgroup
				if( data.children !== undefined ) {

					s += '<li><span class="acf-rel-label">' + data.text + '</span><ul class="acf-bl">';

					s += this.walker( data.children );

					s += '</ul></li>';

				} else {

					s += '<li><span class="acf-rel-item" data-id="' + data.id + '">' + data.text + '</span></li>';

				}

			}


			// return
			return s;

		},

		submit_filter: function( e ){

			// don't submit form
			if( e.which == 13 ) {

				e.preventDefault();

			}

		},

		change_filter: function( e ){

			// vars
			var val = e.$el.val(),
				filter = e.$el.data('filter');


			// Bail early if filter has not changed
			if( this.$el.data(filter) == val ) {

				return;

			}


			// update attr
			this.$el.data(filter, val);


			// reset paged
			this.$el.data('paged', 1);


			// fetch
			if( e.$el.is('select') ) {

				this.fetch();

				// search must go through timeout
			} else {

				this.maybe_fetch();

			}

		},

		add_item: function( e ){

			// max posts
			if( this.o.max > 0 ) {

				if( this.$values.find('.acf-rel-item').length >= this.o.max ) {

					alert( acf._e('recent_posts', 'max').replace('{max}', this.o.max) );

					return;

				}

			}


			// can be added?
			if( e.$el.hasClass('disabled') ) {

				return false;

			}


			// disable
			e.$el.addClass('disabled');


			// template
			var html = [
				'<li>',
				'<input type="hidden" name="' + this.$input.attr('name') + '[]" value="' + e.$el.data('id') + '" />',
				'<span data-id="' + e.$el.data('id') + '" class="acf-rel-item">' + e.$el.html(),
				'<a href="#" class="acf-icon -minus small dark" data-name="remove_item"></a>',
				'</span>',
				'</li>'].join('');


			// add new li
			this.$values.children('.list').append( html )


			// trigger change on new_li
			this.$input.trigger('change');


			// validation
			acf.validation.remove_error( this.$field );

		},

		remove_item : function( e ){

			// vars
			var $span = e.$el.parent(),
				id = $span.data('id');


			// remove
			$span.parent('li').remove();


			// show
			this.$choices.find('.acf-rel-item[data-id="' + id + '"]').removeClass('disabled');


			// trigger change on new_li
			this.$input.trigger('change');

		}

	});


})(jQuery);
