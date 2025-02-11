import OpenAI from "openai";

export class LLM{

    baseUrl: string;
    model: string;
    apiKey:string = "key";
    client: OpenAI;
    messages: OpenAI.ChatCompletionMessageParam[] = []

    constructor(config:{
        baseUrl: string,
        model: string,
        apiKey?: string
    }){

        if(config.apiKey)
            this.apiKey = config.apiKey

        this.model = config.model
        this.baseUrl = config.baseUrl

        this.client = new OpenAI({
            baseURL: this.baseUrl,
            apiKey: this.apiKey
        });

    }

    async prompt(content: string, systemPrompt?: string): Promise<string>{

        if(systemPrompt){
            this.messages.push({
                role: "system",
                content: systemPrompt
            },{
                role:"user",
                content: "Content follows: "+content
            })
        }

        console.log("messages is ",JSON.stringify(this.messages));

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: this.messages
        })

        return response.choices[0].message.content || '';
    }

    
}