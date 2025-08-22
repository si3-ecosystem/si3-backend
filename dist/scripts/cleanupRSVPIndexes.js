"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const rsvpModel_1 = __importDefault(require("../models/rsvpModel"));
dotenv_1.default.config();
function cleanupRSVPIndexes() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.connectDB)();
        try {
            console.log('🧹 Cleaning up problematic RSVP indexes...\n');
            const collection = rsvpModel_1.default.collection;
            // Get current indexes
            const indexes = yield collection.indexes();
            // Find and drop problematic unique indexes on nullable fields
            const problematicIndexes = [
                'confirmationToken_1',
                'calendarToken_1'
            ];
            for (const indexName of problematicIndexes) {
                const index = indexes.find(idx => idx.name === indexName);
                if (index) {
                    console.log(`🗑️  Dropping problematic index: ${indexName}`);
                    try {
                        yield collection.dropIndex(indexName);
                        console.log(`✅ Successfully dropped ${indexName}`);
                    }
                    catch (error) {
                        console.log(`❌ Failed to drop ${indexName}:`, error);
                    }
                }
                else {
                    console.log(`✅ Index ${indexName} not found (already removed)`);
                }
            }
            console.log('\n🎉 Cleanup completed!');
            console.log('You should now be able to create RSVPs without duplicate key errors.');
        }
        catch (error) {
            console.error('❌ Error:', error);
        }
        finally {
            yield (0, db_1.closeConnection)();
        }
    });
}
if (require.main === module) {
    cleanupRSVPIndexes();
}
