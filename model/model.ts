namespace $ {
	
	/**
	 * Extended GitHub Model with multimodal support (images, audio)
	 */
	export class $bog_bot_model extends $mol_github_model {
		
		/** Override names to return multimodal models */
		@ $mol_memo.method
		override names(): string[] {
			return [
				'openai/gpt-4o-mini',     // Same as gd/bot default, works well with JSON
			]
		}
		
		/** Add user prompt with multimodal content support */
		@ $mol_action
		ask_multimodal( content: any ) {
			this.history([
				... this.history(),
				{
					role: "user",
					content: typeof content === 'string' ? JSON.stringify( content ) : content,
				} as any
			])
			return this
		}
		
		/** Override request_body to handle multimodal messages */
		@ $mol_mem_key
		override request_body( model: string ) {
			console.log('🔧 request_body() called for model:', model)
			
			const messages = this.history().map( msg => {
				// If message has array content (multimodal), keep it as is
				if( msg.role === 'user' && typeof msg.content !== 'string' ) {
					try {
						// Try to parse if it's stringified
						const parsed = JSON.parse( msg.content as any )
						if( Array.isArray( parsed ) ) {
							return { ...msg, content: parsed }
						}
					} catch {
						// Not JSON, keep as is
					}
				}
				return msg
			})
			
				const payload = {
					model,
					stream: false,
					response_format: { type: 'json_object' },
					messages: [
						{ role: 'system', content: this.rules() },
						... messages,
					],
					tools: [ ... this.tools() ].map( ([ name, info ])=> ({
						type: "function",
						function: {
							name,
							description: info.descr,
							strict: true,
							parameters: info.params,
						},
					}) ),
					... this.params(),
				}
				
				console.log('📤 Request body:', JSON.stringify(payload, null, 2).substring(0, 500) + '...')
				return JSON.stringify(payload)
		}
		
	}
	
}
