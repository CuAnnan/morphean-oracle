'use strict';

import MongoConnectionFactory from "../MongoConnectionFactory.js";
class Controller
{
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