import {defineConfig} from '@playwright/test';
import cards from './playwright.cards.config';
export default defineConfig({...cards,testMatch:['ui-control-inventory.spec.ts'],reporter:[['list'],['json',{outputFile:'artifacts/card-repair/control-inventory.json'}]]});
