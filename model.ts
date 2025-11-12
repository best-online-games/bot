namespace $ {
	
	/**
	 * Extended GitHub Model with multimodal support (images, audio)
	 */
	export class $bog_bot_model extends $mol_github_model {
		
		/** Override names to return multimodal models */
		@ $mol_memo.method
		override names(): string[] {
			return [
				'microsoft/phi-4-multimodal-instruct',
				'meta-llama/Llama-3.2-90B-Vision-Instruct',
				'openai/gpt-4o',
				'xai/grok-3',
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
			
			return JSON.stringify({
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
			})
		}
		
	}
	
}
