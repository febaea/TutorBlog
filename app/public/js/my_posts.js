// // Function to load posts made by user who is currently logged in
// const postForm = document.getElementById("postForm");
// postForm.onsubmit = async (e) => {
//     e.preventDefault();

//     const title = document.getElementById("title_field").value.trim();
//     const content = document.getElementById("content_field").value.trim();
//     const uploadInput = document.getElementById("upload_field");

//     const file = uploadInput.files[0];

//     //validations
//     if (!title || !content) {
//         alert("Title and content are required.");
//         return;
//     }

//     if (title.length > 255) {
//         alert("Title too long");
//         return;
//     }

//     if (content.length > 50000) {
//         alert("Post too long");
//         return;
//     }

//     //file size check
//     if (file) {
//         if (file.size > 5 * 1024 * 1024) {
//             alert("PDF too large");
//             return;
//         }
//     }

//     //Multipurpose Internet Mail Extensions or MIME type check
//     //validates nature and format of file
//     if (file.type !== "application/pdf") {
//         alert("Only PDFs allowed");
//         return;
//     }

//     // Disable button and show loading
//     const submitBtn = postForm.querySelector('button[type="submit"]');
//     const originalText = submitBtn.textContent;
//     submitBtn.textContent = "Posting...";
//     submitBtn.disabled = true;

//     try{

//         //use FormData for files
//         const formData = new FormData();

//         formData.append("title", title);
//         formData.append("content", content);

//         if (file) {
//             formData.append("upload", file);
//         }

//         //Send to backend
//         const response = await fetch("/makepost", {
//             method: "POST", 
//             body: formData
//         });

//         //check if redirected (successful)
//         if (response.redirected) {
//             window.location.href = response.url;
//             //call function to load posts
//             return;
//         }

//         const result = await response.text();
//         alert(result);
    
//     }
//     catch (error) {
//         console.error(error);
//         alert("Failed to share post. Make sure the server is running.");
//     }
//     finally {

//         //add button again
//         submitBtn.Btn.textContent = originalText;
//         sublitBtn.disabled = false;
//     }
// };




// // Function to load posts made by user who is currently logged in
// async function loadPosts() {

//     try {
        
//         //fetch posts from backend
//         const reponse = await fetch("./posts");

//         if (!response.ok) {
//             throw new Error("Failed to load posts");
//         }

//         const posts = await response.json();
//         const postList = document.getElementById("postsContainer");

//         //remove old posts
//         document.querySelectorAll(".post").forEach(post => post.remove());

//         //add posts
//         posts.forEach(post => {

//             const postContainer = document.createElement('article');
//             postContainer.classList.add('post');
        
//             const titleContainer = document.createElement('h3');
//             titleContainer.textContent = post.title;
//             postContainer.appendChild(titleContainer);
            
//             const timeContainer = document.createElement('h5');
//             const formattedDate =
//                 new Date(post.created_at).toLocaleString();

//             timeContainer.textContent = formattedDate;
//             postContainer.appendChild(timeContainer);

//             const contentContainer = document.createElement('p');

//             //textContent prevents XSS
//             //innerHTML executes javascript
//             contentContainer.textContent = post.content;

//             postContainer.appendChild(contentContainer);

//             //edit button
//             const editBtn = document.createElement('button');
//             editBtn.classList.add('editBtn');
//             editBtn.textContent = 'Edit';
//             editBtn.dataset.postId = post.id;
//             editBtn.addEventListener('click', editPost);
//             postContainer.appendChild(editBtn);

//             //delete button
//             const delBtn = document.createElement('button');
//             delBtn.classList.add('delBtn');
//             delBtn.textContent = 'Delete';
//             delBtn.dataset.postId = post.id;
//             delBtn.addEventListener('click', deletePost);
//             postContainer.appendChild(delBtn);

//             //insert at top
//             postList.prepend(postContainer);
//         });       
//     } catch (error) {
//         console.error(error);

//         alert("Failed to load posts.")
//     }
// }

// loadPosts();

// // Function to remove a post from the page after clicking delete - this is also reflected on the server side
// async function deletePost(event) {
//     const postId = event.target.dataset.postId;

//     //confirmation
//     const confirmed = confirm(
//         "Are you sure you want to delete this post?"
//     );

//     if (!confirmed) {
//         return;
//     }

//     try {
//         const response = await fetch('/api/delete-post', {
//             method: 'POST',

//             headers: {
//                 'Content-Type': 'application/json'
//             },

//             body: JSON.stringify({
//                 postId
//             })
//         });

//         const result = await response.json();

//         if (!response.ok) {
//             throw new Error(result.error);
//         }
//         //reload posts
//         loadPosts();

//     } catch (error) {
//         console.error(error);
//         alert('Failed to delete post.');
//     }
// }

// // Function to edit post
// async function editPost(event) {
//     const postId = event.target.dataset.postId;

//     // Get post that the user clicked on
//     const article = event.target.closest('.post');

//     const title = article.querySelector('h3').textContent;

//     const content = article.querySelector('#content').textContent;
   
//     // Fill out form fields with data grabbed from post
//     document.getElementById('title_field').value = title;
//     document.getElementById('content_field').value = content;

//      //store editing post id
//     document.getElementById('postId').value = postId;
    
//     // Scroll user to post form
//     document.getElementById("postForm").scrollIntoView({behavior: "smooth"});

// }

// // Function to filter posts on page using search bar
// function searchPosts() {

//     let searchBar = document.getElementById('search');

//     // Get contents of search bar
//     let filter = searchBar.value.toUpperCase();

//     let postList = document.getElementById('myPosts');
//     let posts = postList.getElementsByTagName('article');

//     // Loop through all posts, and hide ones that don't match the search
//     for (i = 0; i < posts.length; i++) {

//         // Search body of post
//         let content = posts[i].getElementsByTagName('p')[0];
//         let postContent = content.textContent || content.innerText;

//         // Search title of post
//         let title = posts[i].getElementsByTagName("h3")[0];
//         let titleContent = title.textContent || title.innerText;

//         // Search username
//         let username = posts[i].getElementsByTagName("h5")[0];
//         let usernameContent = username.textContent || username.innerText;

//         // Change display property of posts depending on whether it matches the search or not
//         if (postContent.toUpperCase().indexOf(filter) > -1 || titleContent.toUpperCase().indexOf(filter) > - 1 ||
//              usernameContent.toUpperCase().indexOf(filter) > - 1) {
//             posts[i].style.display = "";
//         } else {
//             posts[i].style.display = "none";
//         }
//     }
// }

// document.getElementById("search").addEventListener("keyup", searchPosts);

const postForm = document.getElementById("postForm");
postForm.onsubmit = async (e) => {
    e.preventDefault();

    const title = document.getElementById("title_field").value.trim();
    const content = document.getElementById("content_field").value.trim();
    const uploadInput = document.getElementById("upload_field");

    const file = uploadInput.files[0];

    //validations
    if (!title || !content) {
        alert("Title and content are required.");
        return;
    }

    if (title.length > 255) {
        alert("Title too long");
        return;
    }

    if (content.length > 50000) {
        alert("Post too long");
        return;
    }
    


    //Multipurpose Internet Mail Extensions or MIME type check
    //validates nature and format of file
    if (file) {
        if (file.type !== "application/pdf") {
            alert("Only PDFs allowed");
            return;
        }
        //check file size
        if (file.size > 5 * 1024 * 1024) {
            alert("PDF too large");
            return;
        }
    }

    // Disable button and show loading
    const submitBtn = postForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Posting...";
    submitBtn.disabled = true;

    try{

        //use FormData for files
        const formData = new FormData();

        formData.append("title", title);
        formData.append("content", content);

        if (file) {
            formData.append("upload", file);
        }

        //Send to backend
        const response = await fetch("/posts/make-post", {
            method: "POST", 
            body: formData
        });

        //check if redirected (successful)
        if (response.redirected) {
            window.location.href = response.url;
            //call function to load posts
            return;
        }

        const result = await response.text();
        alert(result);
    
    }
    catch (error) {
        console.error(error);
        alert("Failed to share post. Make sure the server is running.");
    }
    finally {

        //add button again
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
};




// Function to load posts made by user who is currently logged in
async function loadPosts() {

    try {
        
        //fetch posts from backend
        const response = await fetch("/posts/my-posts");

        if (!response.ok) {
            throw new Error("Failed to load posts");
        }

        const posts = await response.json();
        const postList = document.getElementById("postsContainer");

        //remove old posts
        document.querySelectorAll(".post").forEach(post => post.remove());

        //add posts
        posts.forEach(post => {

            const postContainer = document.createElement('article');
            postContainer.classList.add('post');
        
            const titleContainer = document.createElement('h3');
            titleContainer.textContent = post.title;
            postContainer.appendChild(titleContainer);
            
            const timeContainer = document.createElement('h5');
            const formattedDate = new Date(post.created_at).toLocaleString();

            timeContainer.textContent = formattedDate;
            postContainer.appendChild(timeContainer);

            const contentContainer = document.createElement('p');

            //textContent prevents XSS
            //innerHTML executes javascript
            contentContainer.textContent = post.content;

            postContainer.appendChild(contentContainer);

            //edit button
            const editBtn = document.createElement('button');
            editBtn.classList.add('editBtn');
            editBtn.textContent = 'Edit';
            editBtn.dataset.postId = post.id;
            editBtn.addEventListener('click', editPost);
            postContainer.appendChild(editBtn);

            //delete button
            const delBtn = document.createElement('button');
            delBtn.classList.add('delBtn');
            delBtn.textContent = 'Delete';
            delBtn.dataset.postId = post.id;
            delBtn.addEventListener('click', deletePost);
            postContainer.appendChild(delBtn);

            //insert at top
            postList.prepend(postContainer);
        });       
    } catch (error) {
        console.error(error);

        alert("Failed to load posts.")
    }
}

loadPosts();

// Function to remove a post from the page after clicking delete - this is also reflected on the server side
async function deletePost(event) {
    const postId = event.target.dataset.postId;

    //confirmation
    const confirmed = confirm(
        "Are you sure you want to delete this post?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch('posts/api/delete-post', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                postId
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }
        //reload posts
        loadPosts();

    } catch (error) {
        console.error(error);
        alert('Failed to delete post.');
    }
}

// Function to edit post
async function editPost(event) {
    const postId = event.target.dataset.postId;

    // Get post that the user clicked on
    const article = event.target.closest('.post');

    const title = article.querySelector('h3').textContent;

    const content = article.querySelector('#content_field').textContent;
   
    // Fill out form fields with data grabbed from post
    document.getElementById('title_field').value = title;
    document.getElementById('content_field').value = content;

     //store editing post id
    document.getElementById('postId').value = postId;
    
    // Scroll user to post form
    document.getElementById("postForm").scrollIntoView({behavior: "smooth"});

}

// Function to filter posts on page using search bar
function searchPosts() {

    let searchBar = document.getElementById('search');

    // Get contents of search bar
    let filter = searchBar.value.toUpperCase();

    let postList = document.getElementById('myPosts');
    let posts = postList.getElementsByTagName('article');

    // Loop through all posts, and hide ones that don't match the search
    for (i = 0; i < posts.length; i++) {

        // Search body of post
        let content = posts[i].getElementsByTagName('p')[0];
        let postContent = content.textContent || content.innerText;

        // Search title of post
        let title = posts[i].getElementsByTagName("h3")[0];
        let titleContent = title.textContent || title.innerText;

        // Search username
        let username = posts[i].getElementsByTagName("h5")[0];
        let usernameContent = username.textContent || username.innerText;

        // Change display property of posts depending on whether it matches the search or not
        if (postContent.toUpperCase().indexOf(filter) > -1 || titleContent.toUpperCase().indexOf(filter) > - 1 ||
             usernameContent.toUpperCase().indexOf(filter) > - 1) {
            posts[i].style.display = "";
        } else {
            posts[i].style.display = "none";
        }
    }
}

document.getElementById("search").addEventListener("keyup", searchPosts);