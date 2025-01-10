import { default as express } from 'express';
import pokedaysRoutes from './routes/pokedays';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/pokedays', pokedaysRoutes);

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
