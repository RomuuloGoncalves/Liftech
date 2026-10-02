import mongoose from 'mongoose';
import { RepositoryBase } from '../../core/coreRepository.js';
import { incidentModel } from '../../models/incidentModel.js';

export class incidentModel extends RepositoryBase<incidentModel>{
    constructor(mongoDB: mongoose.Model<any>) {
        super(mongoDB);
}
}