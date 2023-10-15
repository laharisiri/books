var express = require('express');
const app = express();
var passwordHash = require("password-hash");
const bodyParser = require('body-parser')
app.use(bodyParser.json());
const axios = require('axios');
app.use(bodyParser.urlencoded({extended: false}));
const path = require('path');

app.use(express.static("views"));
const port = 8001

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Filter} = require('firebase-admin/firestore');

var serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount)
});


const db = getFirestore();
app.set("view engine", "ejs");

app.get("/", (req,res) => {
    res.render('home');
})

app.get("/signin", (req,res) => {
    res.render('signin');
})
app.post("/signupsubmit", function(req, res) {
        console.log(req.body);
        db.collection("personalData")
            .where(
                Filter.or(
                    Filter.where("email", "==", req.body.email),
                    Filter.where("user_name", "==", req.body.user_name)
                )
            )
            .get()
            .then((docs) => {
                if (docs.size > 0) {
                    res.send("Hey, this account already exists with the email and username.");
                } else {
                    db.collection("personalData")
                        .add({
                            user_name: req.body.user_name,
                            email: req.body.email,
                            password: passwordHash.generate(req.body.password),
                        })
                        .then(() => {
                            // // Specify the correct file path to your "signin" page
                            // res.sendFile(__dirname + "/views/signin");

                            // const filePath = path.join(__dirname, "views", "signin");
                            // res.sendFile(filePath);
                            res.redirect("/signin");
                        })
                        .catch(() => {
                            res.send("Something Went Wrong");
                        });
                }
            });
    });
    
    


    app.post("/signinsubmit", (req, res) => {
      const email = req.body.email;
      const password = req.body.password;
      console.log(email)
      console.log(password)
    
      db.collection("personalData")
        .where("email", "==", email)
        .get()
        .then((docs) => {
          if (docs.empty) {
            res.send("User not found");
          } else {
            let verified = false;
            docs.forEach((doc) => {
              verified = passwordHash.verify(password, doc.data().password);
            });
            if (verified) {
              res.redirect('/dashboard');
            } else {
              res.send("Authentication failed");
            }
          }
        })
        .catch((error) => {
          console.error("Error querying Firestore:", error);
          res.send("Something went wrong.");
        });
    });
    // Assuming you are using Express.js to render the template
  app.get('/dashboard', (req, res) => {
      // Replace this with your logic to fetch books data
    const books = [
      { volumeInfo: { title: 'Book 1', authors: ['Author 1'], previewLink: 'link1' } },
      { volumeInfo: { title: 'Book 2', authors: ['Author 2'], previewLink: 'link2' } },
        // Add more book objects as needed
    ];

      // Render the EJS template and pass the books variable to it
    res.render('dashboard', { books: books });
  });

    app.get("/signup", (req, res) => {
    res.render('signup'); 
});

app.get("/home", (req, res) => {
    res.render('home'); 
});

app.get("/dashboard", (req, res) => {
    res.render('dashboard'); 
});

app.get("/logout", (req, res) => {
    res.render('home'); 
});
app.get("/dashboard", (req, res) => {
  res.render('dashboard', { books: [] }); // Initialize books as an empty array initially
});
//
// const axios = require('axios');

app.get('/dashboard', async (req, res) => {
  const searchTerm = req.query.search;
  console.log('search term',searchTerm);
  try {
    if (!searchTerm) {
      res.render('dashboard', { books: [] });
      return;
    }
    const apiKey = 'AIzaSyBl082GmM5Flj9YWCLO3BRqI0kuuVcZDNQ'; // Replace with your Google Books API key
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${searchTerm}&key=${apiKey}`);
    const books = response.data.items || [];
    res.render('dashboard', { books });
  }
  catch(error) {
    console.error(error);
    res.render('dashboard', { books: [] }); // Handle the error gracefully
  }
});
//
app.listen(port, () => {
    console.log('Server is running on port ${port}');
});