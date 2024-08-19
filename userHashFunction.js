'use strict';

import crypto from 'crypto';
const {subtle} = crypto;


export default async function(interaction)
{
    const ec = new TextEncoder();
    let digestBuffer = await subtle.digest('SHA-512', ec.encode(`${interaction.guildId}:${interaction.user.id}`));
    const hashArray = Array.from(new Uint8Array(digestBuffer)); // convert buffer to byte array
    return hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
}
