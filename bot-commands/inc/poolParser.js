export default function(interaction, helpText)
{
    let args = interaction.options.getString('pool').toLowerCase();
    if(args === 'help')
    {
        interaction.reply({content:helpText});
        return;
    }


    let modsRaw = interaction.options.getString('modifiers');
    let mods = [];
    if(modsRaw)
    {
        mods = modsRaw.toLowerCase().split(' ');
    }

    let willpower = false;
    let wyrd = false;
    let specialty = false;
    for(let mod of mods)
    {
        if(mod === 'wi' || mod === 'willpower')
        {
            willpower = true;
        }
        else if(mod === 'wy' || mod === 'wyrd')
        {
            wyrd = true;
        }
        else if(mod === 'spec' || mod === 'specialty')
        {
            specialty = true;
        }
    }

    let [parts, diff] = args.split('vs');
    parts = parts.trim();
    return {parts, diff, mods:{willpower, wyrd, specialty}};
}