export type Conversation = {
    from: "host" | "expert",
    conversation: string
}

export type Script = Conversation[]