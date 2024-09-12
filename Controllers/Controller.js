'use strict';

import MongoConnectionFactory from "../MongoConnectionFactory.js";
import ObjectCache from "../ObjectCache.js";
class Controller
{
    /**
     *  @returns {ObjectCache}
     */
    get cache()
    {
        return ObjectCache.getInstance();
    }

    get db()
    {
        return MongoConnectionFactory.getInstance();
    }

    getHost(req)
    {
        return `${req.protocol}://${req.get('Host')}`;
    }
}

export default Controller;