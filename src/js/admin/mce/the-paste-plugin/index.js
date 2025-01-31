import $ from 'jquery'
import mime from 'mime-types'
import Converter from 'converter'
import Notices from 'notices'
// import UA from 'ua'
import Uploader from 'uploader'

class PasteOperation {

	static #instance = null
	static #observer = null

	#files = []

	static init(event) {
		PasteOperation.#instance = new PasteOperation(event)
		return PasteOperation.get();
	}

	static get() {
		return PasteOperation.#instance
	}

	static destroy() {
		PasteOperation.#instance = null
	}

	get isAsync() {
		return this.gdocsItems.length > 0
	}

	get hasPastedFiles() {
		return this.files.length > 0
	}

	get pastedContent() {
		return this.isAsync
			? '<p id="the-pasted-async"></p>' // this.gdocsItems.map( (item,idx) => `<img id="the-pasted-async-${idx}" />`).join('')
			: this.files.map( (file,idx) => {
					const src = URL.createObjectURL(file)

					return `<img id="the-pasted-${file.type}-${idx}" src="${src}" alt="${file.name}" />`
				} )
				.join('')
	}

	get files() {
		return this.#files
	}

	constructor(event) {
		this.clipboardData = event.clipboardData
		this.body = event.target.closest('body')
		this.gdocsItems = Converter.getGdocsClipboardItems( event.clipboardData.items )
		this.#files = Array.from( this.clipboardData.files??[] )

		// no files
		if ( ! this.isAsync && ! this.files.length ) {
			return
		}

		if ( this.isAsync ) {
			// google docs clipboard items present
			(async () => {
				let i
				const html = await Converter.clipboardItemsToHtml( event.clipboardData.items )
				const div = document.createElement('div')
				const placeholder = this.body.querySelector('#the-pasted-async')
				const images = []

				div.innerHTML = html
				images.push( ...Array.from(div.querySelectorAll('img')) )
				this.body.insertBefore( div, placeholder )

				if ( images.length ) {
					for ( i=0; i < images.length; i++ ) {
						images[i].src = await Converter.urlToBlobUrl(images[i].src)
					}
					this.body.dispatchEvent(new Event('FilesPasted'))
				}
				this.body.querySelector('#the-pasted-async')?.remove()
			})()
		// } else if ( UA.browser === 'firefox' ) {
		// Killed! @see https://www.mozilla.org/en-US/firefox/116.0/releasenotes/
			// 	// firefox can only paste one file at a time
			// 	// luckily it is available in the DOM during the input event
			// 	body.addEventListener( 'input', e => {
			// 		// this.files.push( ... await Converter.gdocsClipboardItemsToFiles( event.clipboardData.items ) )
			// 		if ( this.files.length === 1 ) {
			// 			body.querySelector('[src^="data:"]').alt = this.files[0].name
			// 		}
			// 		body.dispatchEvent(new Event('FilesPasted'))
			// 	}, { once: true } )
		} else if ( this.body.querySelector('[src^="data:"]:not(.--paste-process)') ) {
			this.body.dispatchEvent(new Event('FilesPasted'))
		}
	}
	observe() {
		PasteOperation.#observer = new MutationObserver( entries => {
			entries.forEach( entry => {

			})
		}, { childNodes: true, subtree: true } )
		return this
	}
	dumpClipboardData() {
		Array.from(this.clipboardData.files).forEach( el => console.log(el) )
		Array.from(this.clipboardData.items).forEach( el => {
			console.log(el,el.kind,el.type)
			if ( 'string' === el.kind ) {
				el.getAsString(s=>console.log(s))
			}
		} )
		return this
	}
}


tinymce.PluginManager.add( 'the_paste', editor => {

	let pasteBtn,
		toolbar

	if ( ! thepaste.options.editor.datauri ) {

		// always auto uploaded
		thepaste.options.editor.auto_upload = true

	} else {

		// user choice
		thepaste.options.editor.auto_upload = localStorage.getItem( 'thepaste.auto_upload' ) !== 'false';

		// enable / disable autoupload button
		editor.addButton( 'thepaste', {
			icon: 'thepaste',
			tooltip: thepaste.l10n.upload_pasted_images,
			cmd : 'cmd_thepaste',
			onPostRender: function() {
				pasteBtn = this;
			},
			active: thepaste.options.editor.auto_upload
		});

	}

	// upload button in media toolbar flyout
	editor.addButton('wp_img_thepaste_upload', {
		icon: 'dashicon dashicons dashicons-upload thepaste-upload',
		tooltip: thepaste.l10n.upload_image,
		onclick: function() {
			// wrap img, upload
			Uploader.inlineUpload( editor.selection.getNode() )
		}
	});

	// setup media toolbar flyout on node change
	editor.on( 'wptoolbar', function( event ) {
		var uploadBtn;
		if ( event.element.nodeName === 'IMG' && ! editor.wp.isPlaceholder( event.element ) ) {
			event.toolbar = toolbar;

			uploadBtn = toolbar.$el.find('.thepaste-upload').closest('.mce-btn');

			if ( canUpload( event.element ) ) {
				uploadBtn.show();
			} else {
				uploadBtn.hide();
			}
		}
	} );

	// enable / disable autoupload
	editor.addCommand( 'cmd_thepaste', function() {
		thepaste.options.editor.auto_upload = ! thepaste.options.editor.auto_upload;
		localStorage.setItem( 'thepaste.auto_upload', thepaste.options.editor.auto_upload.toString() );
		pasteBtn.active( thepaste.options.editor.auto_upload );
	});

	// init media toolbar flyout
	editor.once( 'preinit', function() {
		if ( editor.wp && editor.wp._createToolbar ) {

			toolbar = editor.wp._createToolbar( [
				'wp_img_alignleft',
				'wp_img_aligncenter',
				'wp_img_alignright',
				'wp_img_alignnone',
				'wp_img_thepaste_upload',
				'wp_img_edit',
				'wp_img_remove',
			] );
		}
	} );


	// true if data source or blob image
	function canUpload( img ) {
		var sub = img.src.substring(0,5);
		return sub === 'blob:' || sub === 'data:';
	}

	const crawlPastedImages = () => {
		return Array.from( editor.dom.doc.body.querySelectorAll('[src^="blob:"]:not(.--paste-process),[src^="data:"]:not(.--paste-process)') )
	}


	editor
		.on( 'init', () => {
			const processImage = async loadedImg => {
				if ( loadedImg.naturalWidth * loadedImg.naturalHeight > thepaste.options.editor.force_upload_size ) {
					Uploader.inlineUpload(loadedImg).catch( err => Notices.error( err.message, true ) || loadedImg.remove() )
				} else if ( loadedImg.src.substr(0,4) === 'blob' ) {
					// make data src
					loadedImg.src = await Converter.blobUrlToDataUrl(loadedImg.src)
				}
			}
			editor.dom.doc.body.addEventListener('FilesPasted', async e => {
				let i, el
				const images = crawlPastedImages()
				for (i=0; i<images.length;i++) {
					el = images[i]
					el.classList.add('--paste-process')
					if ( ! thepaste.options.editor.auto_upload
						&& 'image' === await Converter.urlToType(el.src)
			 		) {
						if ( el.complete ) {
							processImage( el )
						} else {
							el.onload = async () => processImage( el )
						}
					} else {
						Uploader.inlineUpload( el ).catch( err => Notices.error( err.message, true ) || el.remove() )
					}
				}
			})
		})
		.on( 'Paste', e => {
			const pasteOperation = PasteOperation.init(e) //.dumpClipboardData()
			if ( ! pasteOperation.isAsync && ! pasteOperation.files.length ) {
				PasteOperation.destroy()
				return;
			}
			const editorPreProcess = e => {
				/*
				FF: Not Fired if clipboard contains file from FS
				*/
				let content
				// get html from pasteOperation
				if ( content = pasteOperation.pastedContent ) {
					e.content = content
				}
				PasteOperation.destroy()
			}
			const editorPostProcess = e => {
				setTimeout( () => editor.dom.doc.body.dispatchEvent(new Event('FilesPasted')))
				editor.off( 'PastePreProcess', editorPreProcess )
				editor.off( 'PastePostProcess', editorPostProcess )
			}

			editor.once( 'input', async ie => {
				/*
				Fired in FF if clipboard contains file from FS
				*/
				const images = crawlPastedImages()
				let idx, img
				if ( ! images.length ) {
					return
				}
				for (idx=0;idx<images.length;idx++) {
					img = images[idx]
					if ( !! pasteOperation.files[idx] ) {
						img.alt = pasteOperation.files[idx].name
						img.src = await Converter.dataUrlToBlobUrl(img.src)
					}

				}

				setTimeout( () => editor.dom.doc.body.dispatchEvent(new Event('FilesPasted')))

				if ( images.length === pasteOperation.files.length ) {
					// images already processed
					editor.off( 'PastePreProcess', editorPreProcess )
					editor.off( 'PastePostProcess', editorPostProcess )
				}
			})
			.on( 'PastePreProcess', editorPreProcess )
			.on( 'PastePostProcess', editorPostProcess )
		});
} );

// } )(jQuery);
