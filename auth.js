const supabaseUrl='https://tpfvyfxfafhfoghvwrlj.supabase.co';
const supabaseKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZnZ5ZnhmYWZoZm9naHZ3cmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNTAwODAsImV4cCI6MjA2NjkyNjA4MH0.12EQQf00QKigT3ks6VTSS94w1otfLhJHGk82zzNEnxk';

const supabase= window.supabase.createClient(supabaseUrl,supabaseKey);
Document.addEventListener('DomContentLoaded',async()=>{
    const isIndexPage= window.location.pathname.endsWith('index.html')|| window.location.pathname.endsWith('/');
    const isLoginPage= window.location.pathname.endsWith('login.html');
    const {data:{user}}= await supabase.auth.getUser();//for taking user information
    //check condition for user is log in
    if(user){
        if(isLoginPage){
            window.location.href='index.html';
        }
        console.log('logged in as:',user.email);
        }else{
            if(isIndexPage){
                window.location.href='login.html';
            }
            console.log('not logged in');
 
        }
        if(isLoginPage){
            setupAuthTabs();
            setupAuthForms();
        }
    
});
function setupAuthTabs(){
    const loginTab= document.getElementById('login-tab');
    const signupTab=document.getElementById('signup-tab');
    const loginForm=document.getElementById('login-form');
    const signupForm=document.getElementById('signup-form');

    loginTab.addEventListener('click',()=>{
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });
    signupTab.addEventListener('click',()=>{
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        loginForm.classList.remove('active');
        signupForm.classList.add('active'); 
    });
function setupAuthForms(){
    const loginForm=document.getElementById('ligin-form');
    const signupForm=document.getElementById('signup-form');
    const loginError=document.getElementById('login-error');
    const signupError=document.getElementById('signup-error');
    loginForm.addEventListener('submit',async(e)=>{
        e.preventDefault();
        const email=document.getElementById('login-email').value;
        const password=document.getElementById('login-password').value;
        try{
            loginError.textContent='';
            const{data,error}=await auth.singInWithPassword({email,Password});
            if(error)throw error;
            window.location.href='index.html';
        }catch(error){
            console.error('error logging in',error.message);
            //display error message
            loginError.textContent=error.message||'failed to log in. please try again.'
        }
    });
    signupForm.addEventListener('submit',async(e)=>{
        e.preventDefault();
        const username= document.getElementById('signup-username').value;
        const email=document.getElementById('signup-username').value;
        const password=document.getElementById('signup-password').value;
        try{
            signupError.textContent='';
            const{data,error}=awaitsupabase.auth.signup({
                email,
                password,
                options:{data:{username}}
            });
            if(error)throw error;
            if (data.user){
                if(data.session){
                    window.location.href='index.html';
                }else{
                    signupForm.innerHTML=`<div class=" success-message">
                    <h3>Registration successful</h3>
                    <p>Please check your email.to confirm your account before logging in.</P>
                    <button class='auth-submit' onclick="document.getelEmentById('login-tab').click()">
                        Go to Login
                    </button>
                    </div>`;
                }
            }

        }catch(error){
            console.error('Error signing up:',error.message);
            signupError.textContent=error.message||'Failed to sign up.Please try again.'
        }

    });
}
async function logout(){
    try{
        const{error}=await supabase.auth.signOut();
        if(error)throw error;
        window.location.href='login.html';
    }catch(error){
        console.error('Error logging out',error.message);
        alert('Failed to log out. Please try again.')
    }
    }
}
window.logout=logout;