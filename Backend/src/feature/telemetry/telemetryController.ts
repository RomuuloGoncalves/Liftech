// as rotas funcionam, chamando suas respectivas funções dentro do controller, mas não funcionam plenamente devido ao fato de a service não ter sido construída ainda, o que está em vigor é o controller "hipotético"
// import type { Request, Response } from "express";
// import { TelemetryService } from "./telemetryService.js";

// export class TelemetryController {

//     private telemetryService: TelemetryService;

//     constructor(telemetryService: TelemetryService) {
//         this.telemetryService = telemetryService;
//     }

//     async create(req: Request, res: Response) {
//         try {
//             const { dataDados, dispositivoId } = req.body;

//             const telemetry = await this.telemetryService.create(
//                 dataDados,
//                 dispositivoId
//             );

//             return res.status(201).json(telemetry);

//         } catch (error) {
//             return res.status(400).json({
//                 message: error instanceof Error
//                     ? error.message
//                     : "Erro ao criar telemetry"
//             });
//         }
//     }

//     async findAll(req: Request, res: Response) {
//         try {
//             const telemetry = await this.telemetryService.findAll();

//             return res.status(200).json(telemetry);

//         } catch (error) {
//             return res.status(500).json({
//                 message: error instanceof Error
//                     ? error.message
//                     : "Erro ao buscar telemetrias"
//             });
//         }
//     }

//     async findByDispositivo(req: Request, res: Response) {
//         try {
//             const { dispositivoId } = req.params;

//             const telemetry =
//                 await this.telemetryService.findByDispositivo(
//                     dispositivoId
//                 );

//             return res.status(200).json(telemetry);

//         } catch (error) {
//             return res.status(500).json({
//                 message: error instanceof Error
//                     ? error.message
//                     : "Erro ao buscar telemetrias do dispositivo"
//             });
//         }
//     }
// }

import type { Request, Response } from "express";

export class TelemetryController {

    async create(req: Request, res: Response) {
        return res.status(201).json({
            message: "Create telemetry chamado",
            body: req.body
        });
    }

    async findAll(req: Request, res: Response) {
        return res.status(200).json({
            message: "FindAll telemetry chamado"
        });
    }

    async findByDispositivo(req: Request, res: Response) {
        return res.status(200).json({
            message: "FindByDispositivo chamado",
            dispositivoId: req.params.dispositivoId
        });
    }
}