export class userModel {
    private name: string

    constructor(name){
        this.name = name
    }

    protected setName(value: string){
        if(!value){
            return 0
        }

        this.name = value
    }

    protected getName(){
        return this.name 
    }
}