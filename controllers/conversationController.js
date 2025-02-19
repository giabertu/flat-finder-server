const supabase = require('../supabaseClient.js')
const redisCaching = require('../redisCaching.js');

async function addConversation(req, res) {
    const conversation = req.body

    const { response, error } = await supabase
        .from('conversation')
        .insert(conversation)

    if (error) {
        res.json(error)
    } else {

        res.status(200).json(response)

    }
}

//to complete:
async function getConversationById(req, res) {

    const conversation = await redisCaching.getOrSetCache(`conversation:${req.query.conversation_id}`, async () => {
        const {data, error} = await supabase
            .from('conversation')
            .select("*, user1(*), user2(*)")
            .eq('id', req.query.conversation_id)

        if (error) {
            res.json(error)
        }

        return data[0]
    })

    res.status(200).json(conversation)
}


async function getUserConversations(req, res) {

    const [result1, result2] = await Promise.all([
        supabase
            .from("conversation")
            .select("*, user2(*)")
            .eq("user1", req.query.user_id),
        supabase
            .from("conversation")
            .select("*, user1 (*)")
            .eq("user2", req.query.user_id)
    ])

    res.json(result1.data.concat(result2.data))

}

async function getConversation(req, res) {
    // const { user1, user2 } = req.query;
    const { user1, user2 } = req.params
    console.log({ user1, user2 });

    const [result1, result2] = await Promise.all([
        supabase
            .from("conversation")
            .select("*, user2 ( * )")
            .eq("user1", user1)
            .eq("user2", user2),
        supabase
            .from("conversation")
            .select("*, user1 ( * )")
            .eq("user1", user2)
            .eq("user2", user1)
    ])

    if (result1.data.length > result2.data.length) {
        res.json(result1.data[0]);
    } else if (result2.data.length > result1.data.length) {
        console.log('second if', result1.data, result2.data)
        res.json(result2.data[0]);
    } else if (result1.data.length === 0 && result2.data.length === 0) {
        const response = await supabase.from('conversation').insert({ user1, user2 }).select("*, user2 ( * )")
        console.log({ response })
        res.json(response.data[0])
    }
}


// async function getConversation(req, res) {

//     const response = await supabase
//                             .from('ticket')
//                             .select()
//                             .eq('creator', req.query.user_id)

//     res.status(200).json(response)
// }

module.exports = {
    addConversation,
    getConversation,
    getConversationById,
    getUserConversations
}