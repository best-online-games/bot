namespace $.$$ {
	
	type MultimodalContent = {
		type: 'text'
		text: string
	} | {
		type: 'image_url'
		image_url: { url: string }
	} | {
		type: 'input_audio'
		input_audio: { data: string, format: string }
	}
	
	export class $bog_bot extends $.$bog_bot {
		
		@ $mol_mem
		attached_images( next?: File[] ) {
			return next ?? []
		}
		
		@ $mol_mem
		attached_audio( next?: File[] ) {
			return next ?? []
		}
		
		media_recorder?: MediaRecorder
		audio_chunks: Blob[] = []
		
		@ $mol_action
		image_upload() {
			const input = document.createElement('input')
			input.type = 'file'
			input.accept = 'image/*'
			input.multiple = true
			input.onchange = () => {
				const files = Array.from( input.files ?? [] )
				this.attached_images([ ... this.attached_images(), ... files ])
			}
			input.click()
		}
		
		// Paste screenshot from clipboard
		@ $mol_action
		async paste_screenshot() {
			try {
				const items = await navigator.clipboard.read()
				for( const item of items ) {
					for( const type of item.types ) {
						if( type.startsWith('image/') ) {
							const blob = await item.getType( type )
							const file = new File([ blob ], `screenshot-${Date.now()}.png`, { type })
							this.attached_images([ ... this.attached_images(), file ])
						}
					}
				}
			} catch( error ) {
				console.error( 'Failed to read clipboard:', error )
			}
		}
		
		// Enable paste event handler
		override dom_tree() {
			const tree = super.dom_tree()
			
			// Add paste event listener
			if( typeof document !== 'undefined' ) {
				document.addEventListener('paste', async ( event ) => {
					const items = event.clipboardData?.items
					if( !items ) return
					
					for( const item of Array.from( items ) ) {
						if( item.type.startsWith('image/') ) {
							event.preventDefault()
							const blob = item.getAsFile()
							if( blob ) {
								this.attached_images([ ... this.attached_images(), blob ])
							}
						}
					}
				})
			}
			
			return tree
		}
		
		// Audio recording with pointer events
		@ $mol_mem
		is_recording( next?: boolean ) {
			return next ?? false
		}
		
		audio_start( event?: PointerEvent ) {
			if( !event ) return
			console.log('🎤 audio_start event')
			event.preventDefault()
			this.is_recording( true )
			this.start_audio_recording()
		}
		
		audio_stop( event?: PointerEvent ) {
			if( !event ) return
			console.log('🎤 audio_stop event')
			event.preventDefault()
			this.is_recording( false )
			this.stop_audio_recording()
		}
		
		@ $mol_action
		async start_audio_recording() {
			try {
				console.log('🎤 Requesting microphone access...')
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
				console.log('🎤 Microphone access granted')
				
				this.media_recorder = new MediaRecorder( stream )
				this.audio_chunks = []
				
				this.media_recorder.ondataavailable = ( event ) => {
					console.log('🎤 Audio data available:', event.data.size, 'bytes')
					if( event.data.size > 0 ) {
						this.audio_chunks.push( event.data )
					}
				}
				
				this.media_recorder.onstop = () => {
					console.log('🎤 Recording stopped, chunks:', this.audio_chunks.length)
					const audioBlob = new Blob( this.audio_chunks, { type: 'audio/webm' })
					const audioFile = new File([ audioBlob ], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
					console.log('🎤 Audio file created:', audioFile.name, audioFile.size, 'bytes')
					this.attached_audio([ ... this.attached_audio(), audioFile ])
					console.log('🎤 Total attached audio files:', this.attached_audio().length)
					
					// Stop all tracks
					stream.getTracks().forEach( track => track.stop() )
				}
				
				this.media_recorder.start()
				console.log('🎤 MediaRecorder started')
				
			} catch( error ) {
				console.error('❌ Failed to start recording:', error)
			}
		}
		
		@ $mol_action
		stop_audio_recording() {
			console.log('🎤 stop_audio_recording called, recorder state:', this.media_recorder?.state)
			if( this.media_recorder && this.media_recorder.state !== 'inactive' ) {
				this.media_recorder.stop()
				console.log('🎤 Recorder stopped')
			}
		}
		
		@ $mol_mem
		override Recording_indicator() {
			const indicator = super.Recording_indicator()
			const node = indicator.dom_node() as HTMLElement
			if( !this.is_recording() ) {
				node.style.display = 'none'
			} else {
				node.style.display = ''
			}
			return indicator
		}
		
		// Convert File to base64 for API
		async file_to_base64( file: File ): Promise<string> {
			return new Promise((resolve, reject) => {
				const reader = new FileReader()
				reader.onload = () => {
					const result = reader.result as string
					const base64 = result.split(',')[1]
					resolve( base64 )
				}
				reader.onerror = reject
				reader.readAsDataURL( file )
			})
		}
		
		// Preview attachments
		@ $mol_mem
		override attachments_preview(): string[] {
			const preview: string[] = []
			
			this.attached_images().forEach( (_, index) => {
				preview.push( this.Attached_image_wrap( index ) as any )
			})
			
			this.attached_audio().forEach( (_, index) => {
				preview.push( this.Attached_audio_wrap( index ) as any )
			})
			
			return preview
		}
		
		@ $mol_mem_key
		attached_image_uri( index: number ): string {
			const file = this.attached_images()[ index ]
			if( !file ) return ''
			return URL.createObjectURL( file )
		}
		
		@ $mol_mem_key
		attached_audio_name( index: number ): string[] {
			const file = this.attached_audio()[ index ]
			if( !file ) return []
			return [ file.name ]
		}
		
		@ $mol_action
		remove_image( index: number ) {
			const images = this.attached_images()
			this.attached_images( images.filter( (_, i) => i !== index ) )
		}
		
		@ $mol_action
		remove_audio( index: number ) {
			const audio = this.attached_audio()
			this.attached_audio( audio.filter( (_, i) => i !== index ) )
		}
		
		// Build multimodal content array
		async build_multimodal_content( text: string ): Promise<MultimodalContent[]> {
			console.log('🏗️ build_multimodal_content started')
			console.log('🏗️ Text:', text)
			console.log('🏗️ Images to process:', this.attached_images().length)
			console.log('🏗️ Audio to process:', this.attached_audio().length)
			
			const content: MultimodalContent[] = []
			
			// Add text
			if( text ) {
				console.log('🏗️ Adding text to content')
				content.push({ type: 'text', text })
			}
			
			// Add images
			for( const img of this.attached_images() ) {
				console.log('🏗️ Processing image:', img.name, img.size, 'bytes')
				const base64 = await this.file_to_base64( img )
				console.log('🏗️ Image converted to base64, length:', base64.length)
				content.push({
					type: 'image_url',
					image_url: { url: `data:${img.type};base64,${base64}` }
				})
			}
			
			// Add audio
			for( const audio of this.attached_audio() ) {
				console.log('🏗️ Processing audio:', audio.name, audio.size, 'bytes')
				const base64 = await this.file_to_base64( audio )
				const format = audio.type.split('/')[1] || 'wav'
				console.log('🏗️ Audio converted to base64, format:', format, 'length:', base64.length)
				content.push({
					type: 'input_audio',
					input_audio: { data: base64, format }
				})
			}
			
			console.log('🏗️ build_multimodal_content finished, items:', content.length)
			return content
		}
		
		// Override communication to support multimodal
		@ $mol_mem
		override communication() {
			
			const history = super.history()
			console.log('💬 communication() called, history length:', history.length)
			
			if( history.length % 2 === 0 ) {
				console.log('💬 History length is even, skipping')
				return
			}
			
			console.log('💬 Last message:', history[history.length - 1])
			
			const model = this.Model() as $bog_bot_model
			const fork = model.fork() as $bog_bot_model
			
			console.log('💬 Building history for model...')
			
			// Build history with multimodal support
			for( let i = 0; i < history.length; ++i ) {
				const msg = history[i]
				
				console.log(`💬 Processing message ${i}:`, typeof msg, Array.isArray(msg) ? 'array' : '')
				
				// Check if message contains multimodal data
				if( typeof msg === 'string' ) {
					if( i % 2 ) {
						console.log(`💬 [${i}] Assistant message (tell)`)
						fork.tell({ response: msg, digest: null, title: null })
					} else {
						console.log(`💬 [${i}] User text message (ask)`)
						fork.ask( msg )
					}
				} else {
					// Multimodal message
					if( i % 2 ) {
						console.log(`💬 [${i}] Assistant multimodal (tell)`)
						fork.tell( msg )
					} else {
						console.log(`💬 [${i}] User multimodal message (ask_multimodal)`)
						fork.ask_multimodal( msg )
					}
				}
			}
			
			console.log('💬 Sending request to model...')
			
			try {
				const resp = fork.response()
				console.log('💬 Response received:', resp)
				this.dialog_title( resp?.title )
				this.digest( resp?.digest )
				super.history([ ... history, resp?.response ])
			} catch( error: any ) {
				console.error('❌ Communication error:', error)
				if( $mol_fail_log( error ) ) {
					super.history([ ... history, '📛' + error.message ])
				}
			}
			
		}
		
		// Override prompt_submit to include attachments
		override prompt_submit() {
			const text = this.prompt_text()
			const images = this.attached_images()
			const audio = this.attached_audio()
			
			console.log('📤 prompt_submit called')
			console.log('📤 Text:', text)
			console.log('📤 Images:', images.length)
			console.log('📤 Audio:', audio.length)
			
			// If no attachments, use default behavior
			if( images.length === 0 && audio.length === 0 ) {
				console.log('📤 No attachments, using default behavior')
				super.prompt_submit()
				return
			}
			
			console.log('📤 Building multimodal content...')
			
			// Build multimodal message
			this.build_multimodal_content( text ).then( content => {
				console.log('📤 Multimodal content built:', content)
				console.log('📤 Content items:', content.length)
				
				const message = content.length === 1 && content[0].type === 'text'
					? text  // Simple text message
					: content  // Multimodal message
				
				console.log('📤 Adding to history:', message)
				
				const current_history = super.history()
				super.history([
					... current_history,
					message
				])
				
				console.log('📤 History updated')
				
				this.prompt_text( '' )
				this.attached_images([])
				this.attached_audio([])
				
				console.log('📤 Cleared attachments')
			}).catch( error => {
				console.error('❌ Error building multimodal content:', error)
			})
		}
		
	}
}
