import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const API_URL_SEARCH = "https://openlibrary.org/search.json";
const API_URL_COVER = "https://covers.openlibrary.org/b/olid/";
let searchTitle;
let display = [];
let searchResult = [];
let myBooks = [];
let id = 0;//temporary id
let addId;//id of the selected book

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
    res.render("index.ejs",{
        books: display
    });
  });

  //Saving search result from API to an object
  app.post("/", async (req, res) => {
    let search = req.body.searchTitle;
    let selectedId = req.body.selectedId;
    let myRating = req.body.myRating;
    let myReview = req.body.myReview;
    searchTitle = search;
    let result = await checkItems();
    let index = 0;
    
    if (search) {
        searchResult=[];
        try{
            (result.docs).forEach((element) => {
                let authorName = (element.author_name);
                let editionKey = (element.edition_key);
                if (authorName && editionKey){
                    searchResult[index] = {
                        index: index,
                        title: element.title,
                        author: authorName[0],
                        key: (API_URL_COVER+`${editionKey[0]}-M.jpg`)
                    };
                index++;
                }    
            });
            } catch (error) {
                console.log("End of Result.");
            }
            display = searchResult;
            res.redirect("/");
    }
    //link for cover photo no need to set a code for get, just use the link as href src for img
    if (selectedId){
        res.render("partials/new.ejs",{
            index: id,
            title: searchResult[selectedId].title,
            author: searchResult[selectedId].author,
            key: searchResult[selectedId].key
        });
        addId = selectedId;
    }
    if (myRating && myReview){
        console.log(addId);
        
        try{
            //codes for temporary saving selected book in myBooks array.
            myBooks.push({
                index: id,
                title: searchResult[addId].title,
                author: searchResult[addId].author,
                key: searchResult[addId].key,
                rating: myRating,
                review: myReview
            });
            id++;
            display = myBooks;
            res.redirect("/");
        } catch (error) {
            console.log(error.message);
        }
    }
    
    
    });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });