import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const API_URL_SEARCH = "https://openlibrary.org/search.json";
const API_URL_COVER = "https://covers.openlibrary.org/b/olid/";
let searchTitle;
let searchResult = {};

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

async function checkItems() {
    let result;

    try{
        const search = await axios.get(API_URL_SEARCH+`?title=${searchTitle}&fields=title,author_name,edition_key`);
        result = search.data;
    } catch (error) {
        console.log(error.message);
    }
        
    return result;
  }

  app.get("/", async (req, res) => {

  });

  //Saving search result from API to an object
  app.post("/", async (req, res) => {
    let search = req.body.searchTitle;
    let selectedId = req.body.selectedId;

    searchTitle = search;
    let result = await checkItems();
    let index = 0;
    let cover;

    if (search) {
        try{
            (result.docs).forEach((element) => {
                let authorName = (element.author_name);
                let editionKey = (element.edition_key);
                if (authorName && editionKey){
                    searchResult[index] = {
                        title: element.title,
                        author: authorName[0],
                        key: editionKey[0]
                    };
                index++;
                }    
            });
            } catch (error) {
                console.log("End of Result.");
            }
            res.send(searchResult);
    }
    //link for cover photo no need to set a code for get just use the link as href src for img
    if (selectedId){
        try{
            const olid = searchResult[selectedId].key;
            cover = (API_URL_COVER+`${olid}-M.jpg`);
            res.send(cover);
            console.log(cover);
        } catch (error) {
            console.log(error.message);
        }
    }
    });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });