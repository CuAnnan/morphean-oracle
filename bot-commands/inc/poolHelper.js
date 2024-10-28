import userHash from "../../userHashFunction.js";

const pools = ['glamour','willpower','banality','nightmare'];

export default function(interaction)
{
    return new Promise(
        (resolve, reject)=>{
            userHash(interaction).then(hashHex=>{
                let data = {hashHex:hashHex, pool:'', amount:1};
                let args = interaction.options.getString('pool').toLowerCase();
                if(args.match(/[a-z]+\/\d+/))
                {
                    let [pool, amount] = args.split('/');
                    data.amount = parseInt(amount);
                    data.pool = pool;
                }
                else
                {
                    data.pool = args;
                }
                if(pools.indexOf(data.pool) < 0)
                {
                    reject('The only valid pools for this command are glamour, willpower, banality, and nightmare.');
                }
                resolve(data);
            });
        }
    );
}