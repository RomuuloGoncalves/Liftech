export class deviceModel{
    private enderecoMac: string
    private status: string

    constructor(enderecoMac, status){
        this.enderecoMac = enderecoMac
        this.status = status
    }

    protected setEnderecoMac(value){
        if(!value){
            return 0
        }
        
        this.enderecoMac = value
    }

    protected getEnderecoMac(){
        return this.enderecoMac
    }
}