import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../../server/prisma/generated/client/edge";


export async function POST(request:Request){
    const {title}=await request.json();
    if(!title){
        return new Response("Title is required",{status:400});
    }
    const prisma=new PrismaClient({
        datasourceUrl:process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const todo=await prisma.todo.create({
        data:{
            title,
        }
    });
    return new Response(JSON.stringify(todo),{
        status:201})
}