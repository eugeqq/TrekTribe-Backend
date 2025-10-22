import { Button, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function PruebaScreen(){ 

    const handleCreate=async()=>{   
        const response=await fetch("http://localhost:8081/api/todo",{
            method:'POST',
            body: JSON.stringify({title:'New todo'}),});
    }
    return(
        <SafeAreaView>
            <View>
                <Text>Hola soy la pantalla de prueba</Text>
                <Button title='crear' onPress={handleCreate}/>
            </View>
        </SafeAreaView>
    )
}