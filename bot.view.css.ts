namespace $.$$ {
	
	$mol_style_define( $bog_bot, {
		
		Attachments_preview: {
			flex: {
				direction: 'row',
				wrap: 'wrap',
			},
			gap: $mol_gap.text,
			padding: $mol_gap.block,
		},
		
		Attached_image: {
			maxWidth: '100px',
			maxHeight: '100px',
			objectFit: 'cover',
			borderRadius: $mol_gap.round,
			cursor: 'pointer',
		},
		
		Attached_audio: {
			padding: $mol_gap.text,
			borderRadius: $mol_gap.round,
			gap: $mol_gap.text,
		},
		
		Recording_indicator: {
			color: $mol_theme.special,
			fontSize: '1.5rem',
		},
		
		Prompt_audio_record: {
			':active': {
				background: {
					color: $mol_theme.special,
				},
			},
		},
		
	})
	
}
