const { Client, Intents, MessageEmbed, Collection } = require("discord.js");
const fs = require("fs");
const util = require("util");

const readdir = util.promisify(fs.readdir);

class Soundboard extends Client {

    constructor(option) {
        super(option);
        this.cfg = require("./config.json");
        this.cmds = new Collection();
    };

    async init() {
        const dir = await readdir("./musics/");
        dir.filter((mus) => mus.split(".").pop() === "mp3").forEach((mus) => {
            this.cmds.set(mus.split(".")[0], "./musics/"+mus);
        });

        this.login(this.cfg.token)
    };

    async play(name, message) {
        var voiceChannel = message.guild.channels.cache.get(message.member.voice.channelID);
        if(!voiceChannel) return message.reply(":x: **Tu dois être dans un salon vocal enculé !**");
        voiceChannel.join()
            .then(connection => {
                const dispatcher = connection.play(`./musics/${name}.mp3`);
                message.reply(":white_check_mark: C'est bon enculé, je joue **" + name + "**")
                dispatcher.on("finish", () => {
                    if(name !== "knocking") voiceChannel.leave()
                });
            })
            .catch(console.error);
    }
};

const client = new Soundboard({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] })

client.init()

client.on("message", (message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith(client.cfg.prefix)) return;
    switch(message.content) {
        case client.cfg.prefix+"leave":
            var voiceChannel = message.guild.channels.cache.get(message.guild.member(client.user.id).voice.channelID);
            if(!voiceChannel) return message.reply(":x: **Je ne suis pas dans un salon vocal !**");
            voiceChannel.leave()
            message.reply(":white_check_mark: J'suis partit")
            break;
        case client.cfg.prefix+"join":
            var voiceChannel = message.guild.channels.cache.get(message.member.voice.channelID);
            if(!voiceChannel) return message.reply(":x: **Tu dois être dans un salon vocal enculé !**");
            voiceChannel.join()
            message.reply(":white_check_mark: J'suis la")
            break;
        case client.cfg.prefix+"help":
            const embed = new MessageEmbed()
            .setTitle("Page d'aide de " + client.user.username)
            .setFooter("By Rome")
            .addField("⚙️・Gestion (3)", `\`${client.cfg.prefix}join\`, \`${client.cfg.prefix}leave\`, \`${client.cfg.prefix}help\``)
            .addField("🎵・Musique (" + client.cmds.size + ")", client.cmds.array().map(cmd => "`" + client.cfg.prefix + (cmd.split("/")[2]).split(".mp3")[0] + "`").join(", "))
            .setColor("RANDOM")
            .setDescription("Bot de Soundboard de Rome (pour faire chier les gens)")

            message.channel.send(embed);
            break;
        default: 
            try {
                let name = message.content.split(client.cfg.prefix)[1];
                let nameInCmds = client.cmds.get(name);

                if(nameInCmds) client.play(name, message)
                else return;
            } catch(error) {
                console.log("Error: " + error)
            };
            break;
    }
});

client.on("ready", () => {
    console.log("Bot on !")
});