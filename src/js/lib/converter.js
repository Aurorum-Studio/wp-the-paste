import mime from 'mime-types'

const fixMime = {
	'application/x-zip-compressed': 'application/zip',
}

/**
 *	Generate a filename
 */
const getFilename = suffix => {

	const zerofill = (n,len = 2) => {
		return ('00' + n.toString()).substr(-len)
	}

	let name = thepaste.options.default_filename

	const now = new Date(),
		postname = document.querySelector('#post [name="post_title"]#title')?.value
			|| document.querySelector('.wp-block-post-title')?.textContent
			|| document.querySelector('h1')?.textContent,
		replace_values = thepaste.options.filename_values,
		// username = document.querySelector('.display-name')?.textContent,
		map = [
			{ s: '%Y', r: now.getFullYear() },
			{ s: '%y', r: now.getFullYear() % 100 },
			{ s: '%m', r: zerofill(now.getMonth() + 1) },
			{ s: '%d', r: zerofill(now.getDate()) },
			{ s: '%e', r: now.getDate() },
			{ s: '%H', r: zerofill(now.getHours()) },
			{ s: '%I', r: zerofill(now.getHours() % 12 ) },
			{ s: '%M', r: zerofill(now.getMinutes()) },
			{ s: '%S', r: zerofill(now.getSeconds()) },
			{ s: '%s', r: Math.floor( now.getTime() / 1000 ) }
		];
	if ( 'undefined' !== typeof postname ) {
		map.push( { s: '<postname>', r: postname } );
	} else {
		map.push( { s: '<postname>', r: '' } );
	}
	Object.keys( replace_values ).forEach( k => {
		if ( !! replace_values[k] ) {
			map.push( { s: `<${k}>`, r: replace_values[k] } );
		} else {
			map.push( { s: `<${k}>`, r: '' } );
		}
	})
	map.forEach(function(el){
		name = name.replace( el.s, el.r )
	})
	if ( 'string' === typeof suffix) {
		if ( 'jpeg' === suffix ) { // dammit mime-types lib!
			suffix = 'jpg'
		}
		name += '.' + suffix;
	}
	return name;
}

const safeFilename = ( file, filename = '' ) => {
	let type = file.type
	if ( !! fixMime[type] ) { // windows
		type = fixMime[type]
	}
	filename = filename.replace(/[^\p{L}\p{M}\p{S}\p{N}\p{P}\p{Zs}]/ug,'-').trim()
	if ( ! filename ) {
		filename = getFilename( mime.extension(type) )
	}
	return filename
}

const Converter = {
	clipboardItemsToHtml:  async clipboardItems => {
		let i, item
		for ( i=0; i < clipboardItems.length; i++ ) {
			item = clipboardItems[i]
			if ( 'string' === item.kind && 'text/html' === item.type ) {
				return await Converter.gdocsItemToHtml( item )
			}
		}
		return ''
	},
	getGdocsClipboardItems: clipboardItems => Array.from(clipboardItems).filter( item => 'string' === item.kind && 'application/x-vnd.google-docs-document-slice-clip+wrapped' === item.type ),
	gdocsClipboardItemsToFiles: async clipboardItems => {
		let i, item, src;
		const files = []
		for ( i=0; i < clipboardItems.length; i++ ) {
			item = clipboardItems[i]
			if ( 'string' === item.kind && 'application/x-vnd.google-docs-image-clip+wrapped' === item.type ) {
				files.push( ...await Converter.gdocsItemToFiles( item ) )
			}
		}
		return files
	},
	gdocsClipboardItemsToSources: async clipboardItems => {
		let i, item, src;
		const srcs = []
		for ( i=0; i < clipboardItems.length; i++ ) {
			item = clipboardItems[i]
			if ( 'string' === item.kind && 'application/x-vnd.google-docs-image-clip+wrapped' === item.type ) {
				srcs.push( ...await Converter.gdocsItemToSources( item ) )
			}
		}
		return srcs
	},
	gdocsItemToSources: async item => new Promise( (resolve, reject) => {
		item.getAsString( async str => {
			const src = Object.values(JSON.parse(JSON.parse( str ).data ).image_urls )
			resolve(src)
		} )
	}),
	gdocsItemToFiles: async item => {
		const sources = await Converter.gdocsItemToSources(item)
		const files = []
		for ( i=0;i<sources.length; i++ ) {
			files.push( await Converter.blobUrlToFile(sources[i]) )
		}
		return files
	},
	gdocsItemToHtml: async item => new Promise( (resolve, reject) => {
		item.getAsString( html => resolve(html) )
	}),

	elementToFile: async el => {
		const file = await Converter.urlToFile(el.src,el.alt)
		return file
	},

	urlToFile: async ( url, filename = '') => {
		let file
		const schema = url.substr( 0, url.indexOf(':') )
		if ( 'data' === schema ) {
			file = Converter.dataUrlToFile( url, filename )
		} else if ( ['blob','http','https'].includes( schema ) ) {
			file = await Converter.blobUrlToFile( url, filename )
		}
		return file
	},
	urlToMime: async url => {
		const schema = url.substr( 0, url.indexOf(':') )
		let mime
		if ( 'data' === schema ) {
			mime = Converter.dataUrlToMime( url )
		} else if ( ['blob','http','https'].includes( schema ) ) {
			mime = await Converter.blobUrlToMime( url )
		}
		return mime
	},
	urlToType: async url => {
		const mime = await Converter.urlToMime(url)
		return mime.substr( 0, mime.indexOf('/'))
	},
	urlToBlobUrl: async (url) => {
		const file = await Converter.blobUrlToFile( url )
		return Converter.fileToBlobUrl( file )
	},

	blobToFile: ( blob, filename = '' ) => {
		return new File([blob], safeFilename( blob, filename ), { type: blob.type } );
	},
	blobUrlToMime: async blobUrl =>{
		const blob = await Converter.blobUrlToBlob(blobUrl)
		return blob.type
	},
	blobUrlToType: async blobUrl => {
		const blob = await Converter.blobUrlToBlob(blobUrl)
		return blob.type.substr(0,blob.type.indexOf('/'))
	},
	blobUrlToBlob: async ( blobUrl, filename = '' ) => {
		const blob = await fetch(blobUrl).then( r => r.blob() );
		return blob
	},
	blobUrlToFile: async ( blobUrl, filename = '' ) => {
		const blob = await Converter.blobUrlToBlob(blobUrl)
		return Converter.blobToFile( blob, filename )
	},
	blobUrlToDataUrl: async blobUrl => {
		const blob = await fetch(blobUrl).then( r => r.blob() );
		const dataurl = await Converter.fileToDataUrl(blob)
		return dataurl
	},


	dataUrlToMime: dataurl => dataurl.match('data:([^;]+);')[1],

	dataUrlToType: dataurl => dataurl.match('data:([^\/]+)\/')[1],

	dataUrlToBlob: ( dataurl ) => {
		let arr = dataurl.split(','),
			type = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]),
			n = bstr.length,
			u8arr = new Uint8Array(n);

		while(n--){
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob( [u8arr], { type: type } )
	},

	dataUrlToFile: ( dataurl, filename = '' ) => Converter.blobToFile( Converter.dataUrlToBlob(dataurl), filename ),

	dataUrlToBlobUrl: dataurl => Converter.fileToBlobUrl( Converter.dataUrlToBlob( dataurl ) ),

	fileToBlobUrl: file => URL.createObjectURL(file),

	fileToDataUrl: file => new Promise( ( resolve, reject ) => {
		const fr = new FileReader()
		fr.addEventListener('load', () => resolve( fr.result )  )
		fr.readAsDataURL( file )
	}),
}

module.exports = Converter
