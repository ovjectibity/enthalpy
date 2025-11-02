export const productContextGatheringSchema = {
    "type": "object",
    "properties": {
        "contexts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["product-page-url", "product-documentation", "product-context", "product-name"]
                    },
                    "format": {
                        "type": "string",
                        "enum": ["url", "text", "doc"]
                    },
                    "description": {
                        "type": "string",
                        "nullable": true
                    },
                    "content": {
                        "type": "string"
                    }
                },
                "required": ["type","format","content"],
                "additionalProperties": false
            } 
        }
    },
    "required": ["contexts"],
    "additionalProperties": false
} as const;